import type {InjectionToken, Provider, Type, CustomProvider} from './tokens';
import type {NextDiContainer} from './container';

export interface ProviderBinding {
  token: InjectionToken;
  provider: Provider;
  instance?: any;
  instances?: any[];
  isResolved: boolean;
  isResolving: boolean;
  multi: boolean;
}

export class ModuleRef {
  public readonly providers = new Map<InjectionToken, ProviderBinding[]>();
  public readonly exports = new Set<InjectionToken>();
  public readonly imports = new Set<ModuleRef>();
  public isGlobal = false;

  constructor(
    public readonly moduleType: Type<any>,
    public readonly container: NextDiContainer
  ) {}

  /**
   * Adds a provider to this module.
   */
  public addProvider(provider: Provider): void {
    const token = this.extractToken(provider);
    const isMulti = this.isMultiProvider(provider);

    const binding: ProviderBinding = {
      token,
      provider,
      isResolved: false,
      isResolving: false,
      multi: isMulti,
    };

    if (isMulti) {
      const existing = this.providers.get(token) ?? [];
      existing.push(binding);
      this.providers.set(token, existing);
    } else {
      this.providers.set(token, [binding]);
    }
  }

  /**
   * Adds an export (provider token or imported module token) to this module.
   */
  public addExport(exportedItem: InjectionToken): void {
    this.exports.add(exportedItem);
  }

  /**
   * Checks whether this module exports a specific token.
   */
  public hasExport(token: InjectionToken): boolean {
    if (this.exports.has(token)) {
      return true;
    }

    // Check if an exported module exports this token (re-export)
    for (const exported of this.exports) {
      if (typeof exported === 'function' && this.container.hasModule(exported as Type<any>)) {
        const importedModuleRef = this.container.getModule(exported as Type<any>);
        if (importedModuleRef?.hasExport(token)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Resolves an exported provider from this module or its re-exported modules.
   */
  public getExported<T = any>(token: InjectionToken<T>): T | undefined {
    if (this.hasLocalProvider(token)) {
      return this.getLocal(token);
    }

    // Check re-exported modules
    for (const exported of this.exports) {
      if (typeof exported === 'function' && this.container.hasModule(exported as Type<any>)) {
        const importedModuleRef = this.container.getModule(exported as Type<any>);
        if (importedModuleRef?.hasExport(token)) {
          return importedModuleRef.getExported(token);
        }
      }
    }

    return undefined;
  }

  /**
   * Checks if this module directly defines a provider for the token.
   */
  public hasLocalProvider(token: InjectionToken): boolean {
    return this.providers.has(token);
  }

  /**
   * Resolves a local provider in this module.
   */
  public getLocal<T = any>(token: InjectionToken<T>): T | undefined {
    const bindings = this.providers.get(token);
    if (!bindings || bindings.length === 0) {
      return undefined;
    }

    if (bindings[0].multi) {
      return bindings.map(b => this.container.instantiateBinding(this, b)) as any;
    }

    return this.container.instantiateBinding(this, bindings[0]);
  }

  /**
   * Resolves a dependency with module isolation rules:
   * 1. Local provider
   * 2. Exported from directly imported modules
   * 3. Exported from global modules
   */
  public get<T = any>(token: InjectionToken<T>): T {
    // 1. Local
    if (this.hasLocalProvider(token)) {
      return this.getLocal(token)!;
    }

    // 2. Direct imports
    for (const importedModule of this.imports) {
      if (importedModule.hasExport(token)) {
        const instance = importedModule.getExported(token);
        if (instance !== undefined) {
          return instance;
        }
      }
    }

    // 3. Global modules
    const globalInstance = this.container.getGlobalExport(token);
    if (globalInstance !== undefined) {
      return globalInstance;
    }

    // 4. ModuleRef itself can be injected
    if (token === ModuleRef) {
      return this as any;
    }

    const tokenName = typeof token === 'function' ? token.name : String(token);
    throw new Error(
      `[NextDi] Nest-like resolution error: Provider '${tokenName}' not found or not exported in context of module '${this.moduleType.name}'.`
    );
  }

  private extractToken(provider: Provider): InjectionToken {
    if (typeof provider === 'function') {
      return provider;
    }
    return (provider as CustomProvider).provide;
  }

  private isMultiProvider(provider: Provider): boolean {
    if (typeof provider === 'function') {
      return false;
    }
    return (provider as CustomProvider).multi === true;
  }
}
