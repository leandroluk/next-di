import type {InjectionToken} from '../core/tokens';

export interface InjectableAsOptions {
  multi?: boolean;
}

export interface InjectableAsMetadata {
  tokens: InjectionToken[];
  multiTokens: InjectionToken[];
}

export interface InjectableAsDecorator {
  (
    tokenOrTokensOrOptions:
      | InjectionToken
      | InjectionToken[]
      | ({token?: InjectionToken; tokens?: InjectionToken[]} & InjectableAsOptions),
    options?: InjectableAsOptions
  ): ClassDecorator;
  KEY: symbol;
  getMetadata(target: any): InjectableAsMetadata | undefined;
}

const INJECTABLE_AS_KEY = Symbol('next-di:injectable-as');

export const InjectableAs: InjectableAsDecorator = Object.assign(
  function InjectableAs(
    tokenOrTokensOrOptions:
      | InjectionToken
      | InjectionToken[]
      | ({token?: InjectionToken; tokens?: InjectionToken[]} & InjectableAsOptions),
    options?: InjectableAsOptions
  ): ClassDecorator {
    return (target: object) => {
      const existing: InjectableAsMetadata = Reflect.getMetadata(INJECTABLE_AS_KEY, target) ?? {
        tokens: [],
        multiTokens: [],
      };

      const targetTokens: InjectionToken[] = [];
      let isMulti = false;

      if (Array.isArray(tokenOrTokensOrOptions)) {
        targetTokens.push(...tokenOrTokensOrOptions);
        isMulti = options?.multi ?? false;
      } else if (
        typeof tokenOrTokensOrOptions === 'object' &&
        tokenOrTokensOrOptions !== null &&
        ('token' in tokenOrTokensOrOptions || 'tokens' in tokenOrTokensOrOptions || 'multi' in tokenOrTokensOrOptions)
      ) {
        const opts = tokenOrTokensOrOptions as {
          token?: InjectionToken;
          tokens?: InjectionToken[];
          multi?: boolean;
        };
        if (opts.token) {
          targetTokens.push(opts.token);
        }
        if (opts.tokens) {
          targetTokens.push(...opts.tokens);
        }
        isMulti = opts.multi ?? options?.multi ?? false;
      } else {
        targetTokens.push(tokenOrTokensOrOptions as InjectionToken);
        isMulti = options?.multi ?? false;
      }

      if (isMulti) {
        existing.multiTokens.push(...targetTokens);
      } else {
        existing.tokens.push(...targetTokens);
      }

      Reflect.defineMetadata(INJECTABLE_AS_KEY, existing, target);
    };
  },
  {
    KEY: INJECTABLE_AS_KEY,
    getMetadata: (target: any): InjectableAsMetadata | undefined => Reflect.getMetadata(INJECTABLE_AS_KEY, target),
  }
);
