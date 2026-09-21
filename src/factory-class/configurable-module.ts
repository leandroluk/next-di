import type {DynamicModule, InjectionToken, OptionalFactoryDependency, Type} from '../core/tokens';
import {AutoInjectableModule, type AutoInjectableModuleOptions} from './auto-injectable-module';

export interface ConfigurableModuleOptions<T> extends AutoInjectableModuleOptions {
  configClass: Type<T>;
}

type ResolveToken<Tok> = Tok extends OptionalFactoryDependency
  ? Tok['token'] extends abstract new (...args: never[]) => infer X
    ? X
    : unknown
  : Tok extends abstract new (...args: never[]) => infer X
    ? X
    : unknown;

type ResolveInject<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[]> = {
  [K in keyof Inject]: ResolveToken<Inject[K]>;
};

export type ConfigurableModuleFoorRootAsyncConfig<
  T,
  Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = [],
> = {
  global?: boolean;
  inject?: Inject;
  useFactory: (...args: ResolveInject<Inject>) => T | Promise<T>;
} & Omit<DynamicModule, 'module'>;

export type ConfigurableModuleConstructor<T> = (abstract new (...args: unknown[]) => object) & {
  forRootAsync<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = []>(
    config: ConfigurableModuleFoorRootAsyncConfig<T, Inject>
  ): Promise<DynamicModule>;
};

/**
 * Creates a configurable dynamic module via an async factory.
 */
export function ConfigurableModule<T>(options: ConfigurableModuleOptions<T>): ConfigurableModuleConstructor<T> {
  const {
    configClass,
    providers: staticProviders = [],
    imports: staticImports = [],
    exports: staticExports = [],
    controllers: staticControllers = [],
  } = options;

  const AutoInjectableBase = AutoInjectableModule({
    providers: staticProviders,
    imports: staticImports,
    exports: staticExports,
    controllers: staticControllers,
  });

  abstract class ConfigurableModuleBase extends AutoInjectableBase {
    static async forRootAsync<Inject extends readonly (InjectionToken | OptionalFactoryDependency)[] = []>(
      config: ConfigurableModuleFoorRootAsyncConfig<T, Inject>
    ): Promise<DynamicModule> {
      const {global = false, inject = [] as unknown as Inject, useFactory} = config;

      return {
        global,
        module: this as unknown as Type<object>,
        providers: [
          {provide: configClass, useFactory, inject: [...inject]},
          ...(AutoInjectableBase.providers || []).filter(p => p !== configClass),
        ],
        imports: [...(AutoInjectableBase.imports || [])],
        exports: [configClass, ...(AutoInjectableBase.exports || [])],
        controllers: [...(AutoInjectableBase.controllers || [])],
      };
    }
  }

  return ConfigurableModuleBase;
}
