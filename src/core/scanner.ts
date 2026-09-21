import type {Type, DynamicModule, ForwardReference, InjectionToken, Provider} from './tokens';
import {MODULE_METADATA} from './tokens';
import {isForwardRef} from './forward-ref';
import {NextDiContainer} from './container';
import {ModuleRef} from './module-ref';

export type ModuleInput = Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference;

export class ModuleScanner {
  private readonly scannedModules = new Set<Type<any>>();

  constructor(private readonly container: NextDiContainer) {}

  public async scan(rootModule: ModuleInput): Promise<ModuleRef> {
    const rootRef = await this.scanModule(rootModule);
    this.container.rootModuleRef = rootRef;
    return rootRef;
  }

  private async scanModule(moduleInput: ModuleInput): Promise<ModuleRef> {
    let resolvedInput = moduleInput;

    if (resolvedInput instanceof Promise) {
      resolvedInput = await resolvedInput;
    }

    if (isForwardRef(resolvedInput)) {
      resolvedInput = resolvedInput.forwardRef();
    }

    let moduleType: Type<any>;
    let dynamicMetadata: DynamicModule | undefined;

    if (this.isDynamicModule(resolvedInput)) {
      dynamicMetadata = resolvedInput;
      moduleType = resolvedInput.module;
    } else {
      moduleType = resolvedInput as Type<any>;
    }

    const moduleRef = this.container.addModule(moduleType);

    if (this.scannedModules.has(moduleType)) {
      return moduleRef;
    }
    this.scannedModules.add(moduleType);

    // Read metadata defined via decorator
    const staticImports: ModuleInput[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleType) ?? [];
    const staticProviders: Provider[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, moduleType) ?? [];
    const staticExports: InjectionToken[] = Reflect.getMetadata(MODULE_METADATA.EXPORTS, moduleType) ?? [];
    const isStaticGlobal: boolean = Reflect.getMetadata(MODULE_METADATA.GLOBAL, moduleType) ?? false;

    // Merge static and dynamic providers
    const allProviders: Provider[] = [...staticProviders, ...(dynamicMetadata?.providers ?? [])];

    for (const provider of allProviders) {
      moduleRef.addProvider(provider);
    }

    // Merge static and dynamic exports
    const allExports = [...staticExports, ...(dynamicMetadata?.exports ?? [])];

    for (const exp of allExports) {
      const unwrapExp = isForwardRef(exp) ? exp.forwardRef() : exp;
      if (this.isDynamicModule(unwrapExp)) {
        moduleRef.addExport(unwrapExp.module);
      } else {
        moduleRef.addExport(unwrapExp as InjectionToken);
      }
    }

    if (isStaticGlobal || dynamicMetadata?.global) {
      this.container.addGlobalModule(moduleRef);
    }

    // Merge and scan imports
    const allImports: ModuleInput[] = [...staticImports, ...(dynamicMetadata?.imports ?? [])];

    for (const imp of allImports) {
      const childModuleRef = await this.scanModule(imp);
      moduleRef.imports.add(childModuleRef);
    }

    return moduleRef;
  }

  private isDynamicModule(input: any): input is DynamicModule {
    return input !== null && typeof input === 'object' && 'module' in input && typeof input.module === 'function';
  }
}
