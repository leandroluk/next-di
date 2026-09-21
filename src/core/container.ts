import type {
  InjectionToken,
  Provider,
  Type,
  CustomProvider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
} from './tokens';
import {PARAMTYPES_METADATA} from './tokens';
import {ModuleRef, type ProviderBinding} from './module-ref';
import {isForwardRef} from './forward-ref';
import {Inject, type ParamInjectionMetadata} from '../decorator/inject.decorator';
import {Optional} from '../decorator/optional.decorator';

export class NextDiContainer {
  private readonly modules = new Map<Type<any>, ModuleRef>();
  private readonly globalModules = new Set<ModuleRef>();
  public rootModuleRef?: ModuleRef;

  public addModule(moduleType: Type<any>): ModuleRef {
    let moduleRef = this.modules.get(moduleType);
    if (!moduleRef) {
      moduleRef = new ModuleRef(moduleType, this);
      this.modules.set(moduleType, moduleRef);
    }
    return moduleRef;
  }

  public hasModule(moduleType: Type<any>): boolean {
    return this.modules.has(moduleType);
  }

  public getModule(moduleType: Type<any>): ModuleRef | undefined {
    return this.modules.get(moduleType);
  }

  public addGlobalModule(moduleRef: ModuleRef): void {
    moduleRef.isGlobal = true;
    this.globalModules.add(moduleRef);
  }

  public getGlobalExport<T = any>(token: InjectionToken<T>): T | undefined {
    for (const globalModule of this.globalModules) {
      if (globalModule.hasExport(token)) {
        const instance = globalModule.getExported(token);
        if (instance !== undefined) {
          return instance;
        }
      }
    }
    return undefined;
  }

  public get<T = any>(token: InjectionToken<T>): T {
    const unwrapToken = isForwardRef(token) ? token.forwardRef() : token;

    // If root module is set, resolve through root module
    if (this.rootModuleRef) {
      try {
        return this.rootModuleRef.get(unwrapToken);
      } catch (_err) {
        // Fallback: search exported or local across modules for top-level access
      }
    }

    // Try finding exported in any module
    for (const moduleRef of this.modules.values()) {
      if (moduleRef.hasExport(unwrapToken)) {
        const instance = moduleRef.getExported(unwrapToken);
        if (instance !== undefined) {
          return instance;
        }
      }
    }

    // Try finding in any module's local providers
    for (const moduleRef of this.modules.values()) {
      if (moduleRef.hasLocalProvider(unwrapToken)) {
        const instance = moduleRef.getLocal(unwrapToken);
        if (instance !== undefined) {
          return instance;
        }
      }
    }

    const tokenName = typeof unwrapToken === 'function' ? unwrapToken.name : String(unwrapToken);
    throw new Error(`[NextDi] Could not find provider for token '${tokenName}' in the application context.`);
  }

  public instantiateBinding(moduleRef: ModuleRef, binding: ProviderBinding): any {
    if (binding.isResolved) {
      return binding.instance;
    }

    if (binding.isResolving) {
      const tokenName = typeof binding.token === 'function' ? binding.token.name : String(binding.token);
      throw new Error(
        `[NextDi] Circular dependency detected while resolving token '${tokenName}'. Use forwardRef() to resolve.`
      );
    }

    binding.isResolving = true;
    try {
      binding.instance = this.createInstance(moduleRef, binding.provider);
      binding.isResolved = true;
      return binding.instance;
    } finally {
      binding.isResolving = false;
    }
  }

  private createInstance(moduleRef: ModuleRef, provider: Provider): any {
    // 1. Direct class provider: Type<T>
    if (typeof provider === 'function') {
      return this.instantiateClass(moduleRef, provider);
    }

    const custom = provider as CustomProvider;

    // 2. ClassProvider: { provide, useClass }
    if ('useClass' in custom) {
      const classProvider = custom as ClassProvider;
      return this.instantiateClass(moduleRef, classProvider.useClass);
    }

    // 3. ValueProvider: { provide, useValue }
    if ('useValue' in custom) {
      return (custom as ValueProvider).useValue;
    }

    // 4. FactoryProvider: { provide, useFactory, inject }
    if ('useFactory' in custom) {
      const factoryProvider = custom as FactoryProvider;
      const injectedArgs: any[] = [];

      if (factoryProvider.inject) {
        for (const injectItem of factoryProvider.inject) {
          let token: InjectionToken;
          let isOptional = false;

          if (typeof injectItem === 'object' && injectItem !== null && 'token' in injectItem) {
            token = injectItem.token;
            isOptional = injectItem.optional === true;
          } else {
            token = injectItem as InjectionToken;
          }

          const unwrapToken = isForwardRef(token) ? token.forwardRef() : token;

          try {
            injectedArgs.push(moduleRef.get(unwrapToken));
          } catch (err) {
            if (isOptional) {
              injectedArgs.push(undefined);
            } else {
              throw err;
            }
          }
        }
      }

      return factoryProvider.useFactory(...injectedArgs);
    }

    // 5. ExistingProvider: { provide, useExisting }
    if ('useExisting' in custom) {
      const existingProvider = custom as ExistingProvider;
      const targetToken = isForwardRef(existingProvider.useExisting)
        ? existingProvider.useExisting.forwardRef()
        : existingProvider.useExisting;
      return moduleRef.get(targetToken);
    }

    throw new Error(`[NextDi] Unsupported provider definition: ${JSON.stringify(provider)}`);
  }

  private instantiateClass(moduleRef: ModuleRef, targetClass: Type<any>): any {
    const unwrapClass = isForwardRef(targetClass) ? targetClass.forwardRef() : targetClass;

    // Read constructor parameter types emitted by TypeScript
    const paramTypes: any[] = Reflect.getMetadata(PARAMTYPES_METADATA, unwrapClass) ?? [];
    const injectMeta: ParamInjectionMetadata[] = Inject.getMetadata(unwrapClass);
    const optionalMeta: number[] = Optional.getMetadata(unwrapClass);

    // Map overrides from @Inject()
    const injectMap = new Map<number, InjectionToken>();
    for (const item of injectMeta) {
      injectMap.set(item.index, item.token);
    }
    const optionalSet = new Set<number>(optionalMeta);

    const constructorArgs: any[] = [];

    for (let index = 0; index < paramTypes.length; index++) {
      let token = injectMap.has(index) ? injectMap.get(index)! : paramTypes[index];
      token = isForwardRef(token) ? token.forwardRef() : token;
      const isOptional = optionalSet.has(index);

      if (!token) {
        if (isOptional) {
          constructorArgs.push(undefined);
          continue;
        }
        throw new Error(
          `[NextDi] Cannot resolve parameter at index [${index}] of '${unwrapClass.name}'. Ensure emitDecoratorMetadata is enabled and token is imported.`
        );
      }

      try {
        constructorArgs.push(moduleRef.get(token));
      } catch (err) {
        if (isOptional) {
          constructorArgs.push(undefined);
        } else {
          throw err;
        }
      }
    }

    return new unwrapClass(...constructorArgs);
  }
}
