import type {DynamicModule, InjectionToken, OptionalFactoryDependency, Type} from '../core/tokens';
import type {ModuleMetadata} from '../decorator/module.decorator';
import {resolveProviders} from './auto-injectable-module';
import {type ConfigurableModuleConstructor} from './configurable-module';

type ImportItem = Exclude<ModuleMetadata['imports'], undefined>[number];

interface HasForRootAsync {
  forRootAsync(config: {
    useFactory: (...args: unknown[]) => unknown | Promise<unknown>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
  }): Promise<DynamicModule>;
}

type ResolveToken<TToken> = TToken extends OptionalFactoryDependency
  ? TToken['token'] extends abstract new (...args: never[]) => infer TInstance
    ? TInstance
    : unknown
  : TToken extends abstract new (...args: never[]) => infer TInstance
    ? TInstance
    : unknown;

type ResolveInject<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[]> = {
  [K in keyof Inject]: ResolveToken<Inject[K]>;
};

type ExtractConfigType<TType> =
  TType extends ConfigurableModuleConstructor<infer TConfig>
    ? TConfig
    : TType extends {
          forRootAsync(config: {useFactory: (...args: never[]) => (infer TConfig) | Promise<infer TConfig>}): unknown;
        }
      ? TConfig
      : never;

type BaseSelectableConfig<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[]> = {
  provider: string;
  useFactory?: (...args: ResolveInject<Inject>) => unknown | Promise<unknown>;
  inject?: Inject;
} & Omit<DynamicModule, 'module'>;

export type SelectableModuleConfig<
  TProviders extends Record<string, ImportItem>,
  Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = [],
> = [keyof TProviders & string] extends [never]
  ? BaseSelectableConfig<Inject>
  : {
      [K in keyof TProviders & string]: [ExtractConfigType<TProviders[K]>] extends [never]
        ? {
            provider: K;
            useFactory?: (...args: never[]) => unknown;
            inject?: readonly (InjectionToken | OptionalFactoryDependency)[];
          } & Omit<DynamicModule, 'module'>
        : {
            provider: K;
            useFactory?: (
              ...args: ResolveInject<Inject>
            ) => ExtractConfigType<TProviders[K]> | Promise<ExtractConfigType<TProviders[K]>>;
            inject?: Inject;
          } & Omit<DynamicModule, 'module'>;
    }[keyof TProviders & string];

export type SelectableModuleProviders<TProviders extends Record<string, ImportItem>> = readonly [
  keyof TProviders & string,
  ...(keyof TProviders & string)[],
];

export type SelectableModuleConstructor<TProviders extends Record<string, ImportItem>> = (abstract new (
  ...args: unknown[]
) => object) & {
  readonly providers: SelectableModuleProviders<TProviders>;
  forRootAsync<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = []>(
    config: SelectableModuleConfig<TProviders, Inject>
  ): Promise<DynamicModule>;
};

export function SelectableModule<TProviders extends Record<string, ImportItem>>(params: {
  selectionMap: TProviders;
  imports?: ModuleMetadata['imports'];
  exports?: ModuleMetadata['exports'];
  providers?: ModuleMetadata['providers'];
  controllers?: ModuleMetadata['controllers'];
}): SelectableModuleConstructor<TProviders> {
  const {
    selectionMap,
    imports: baseImports = [],
    exports: baseExports = [],
    providers: baseProviders = [],
    controllers: baseControllers = [],
  } = params;

  abstract class DynamicModuleBase {
    static readonly providers = Object.keys(selectionMap) as unknown as SelectableModuleProviders<TProviders>;

    static async forRootAsync<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = []>(
      config: SelectableModuleConfig<TProviders, Inject>
    ): Promise<DynamicModule> {
      const {
        provider,
        providers,
        imports = [],
        exports = [],
        global = false,
        useFactory,
        inject,
      } = config as {
        provider: string;
        providers?: ModuleMetadata['providers'];
        imports?: ModuleMetadata['imports'];
        exports?: ModuleMetadata['exports'];
        global?: boolean;
        useFactory?: (...args: unknown[]) => unknown | Promise<unknown>;
        inject?: Array<InjectionToken | OptionalFactoryDependency>;
      };

      const selectedModule = selectionMap[provider];

      if (!selectedModule) {
        const available = Object.keys(selectionMap).join(', ');
        throw new TypeError(`Provedor inválido '${provider}'. Disponíveis: ${available}`);
      }

      let importedModule = selectedModule as Exclude<ImportItem, Promise<unknown>>;
      const maybeConfigurable = selectedModule as Partial<HasForRootAsync>;
      if (typeof maybeConfigurable.forRootAsync === 'function' && useFactory) {
        importedModule = await maybeConfigurable.forRootAsync({
          useFactory: useFactory as unknown as (...args: unknown[]) => unknown | Promise<unknown>,
          inject,
        });
      }

      const {
        extra: extraProviders,
        multiExtra: multiExtraProviders,
        tokens: aliasTokens,
        multiTokens: multiAliasTokens,
      } = resolveProviders(providers);

      return {
        global,
        module: this as unknown as Type<DynamicModule>,
        controllers: [...baseControllers],
        providers: [...baseProviders, ...(providers || []), ...extraProviders, ...multiExtraProviders],
        imports: [importedModule, ...baseImports, ...imports],
        exports: [importedModule, ...baseExports, ...exports, ...aliasTokens, ...multiAliasTokens],
      };
    }
  }

  return DynamicModuleBase;
}
