import type {InjectionToken, Provider} from '../core/tokens';
import {Module, type ModuleMetadata} from '../decorator/module.decorator';
import {InjectableAs} from '../decorator/injectable-as.decorator';

export interface AutoInjectableModuleOptions {
  providers?: Provider[];
  imports?: ModuleMetadata['imports'];
  exports?: ModuleMetadata['exports'];
  controllers?: ModuleMetadata['controllers'];
}

export interface ResolvedProviders {
  extra: {provide: InjectionToken; useExisting: InjectionToken}[];
  multiExtra: {provide: InjectionToken; useExisting: InjectionToken; multi: true}[];
  tokens: InjectionToken[];
  multiTokens: InjectionToken[];
}

export type AutoInjectableModuleConstructor = (abstract new (...args: unknown[]) => object) & {
  readonly providers: Provider[];
  readonly exports: ModuleMetadata['exports'];
  readonly imports: ModuleMetadata['imports'];
  readonly controllers: ModuleMetadata['controllers'];
};

export function resolveProviders(providers?: Provider[]): ResolvedProviders {
  if (!providers) {
    return {extra: [], multiExtra: [], tokens: [], multiTokens: []};
  }

  const extra: {provide: InjectionToken; useExisting: InjectionToken}[] = [];
  const multiExtra: {provide: InjectionToken; useExisting: InjectionToken; multi: true}[] = [];
  const tokens: InjectionToken[] = [];
  const multiTokens: InjectionToken[] = [];

  for (const item of providers) {
    if (typeof item === 'function') {
      const metadata = InjectableAs.getMetadata(item);
      if (metadata) {
        for (const token of metadata.tokens) {
          extra.push({provide: token, useExisting: item});
          tokens.push(token);
        }
        for (const token of metadata.multiTokens) {
          multiExtra.push({provide: token, useExisting: item, multi: true});
          multiTokens.push(token);
        }
      }
    }
  }

  return {extra, multiExtra, tokens, multiTokens};
}

export interface AutoInjectableModuleFn {
  (options?: AutoInjectableModuleOptions): AutoInjectableModuleConstructor;
  resolveProviders(providers?: Provider[]): ResolvedProviders;
}

export const AutoInjectableModule: AutoInjectableModuleFn = Object.assign(
  function AutoInjectableModule(options: AutoInjectableModuleOptions = {}): AutoInjectableModuleConstructor {
    const {providers = [], imports = [], exports = [], controllers = []} = options;

    const {
      extra: extraProviders,
      multiExtra: multiExtraProviders,
      tokens: aliasTokens,
      multiTokens: multiAliasTokens,
    } = resolveProviders(providers);

    const finalProviders: Provider[] = [...providers, ...extraProviders, ...multiExtraProviders];
    const finalExports: ModuleMetadata['exports'] = [...exports, ...aliasTokens, ...multiAliasTokens];

    @Module({
      providers: finalProviders,
      exports: finalExports,
      imports,
      controllers,
    })
    abstract class AutoInjectableModuleBase {
      static readonly providers: Provider[] = finalProviders;
      static readonly exports: ModuleMetadata['exports'] = finalExports;
      static readonly imports: ModuleMetadata['imports'] = imports;
      static readonly controllers: ModuleMetadata['controllers'] = controllers;
    }

    return AutoInjectableModuleBase;
  },
  {resolveProviders}
);
