import {INJECT_METADATA, type InjectionToken} from '../core/tokens';

export interface ParamInjectionMetadata {
  index: number;
  token: InjectionToken;
}

/**
 * Decorator that specifies the token to inject for a constructor parameter.
 */
export function Inject(token: InjectionToken): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // When decorating constructor parameter, target is the constructor function itself
    const targetClass = typeof target === 'function' ? target : target.constructor;
    const existing: ParamInjectionMetadata[] = Reflect.getMetadata(INJECT_METADATA, targetClass) ?? [];
    existing.push({index: parameterIndex, token});
    Reflect.defineMetadata(INJECT_METADATA, existing, targetClass);
  };
}

Inject.getMetadata = (target: any): ParamInjectionMetadata[] => {
  return Reflect.getMetadata(INJECT_METADATA, target) ?? [];
};
