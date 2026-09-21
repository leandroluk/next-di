import {OPTIONAL_METADATA} from '../core/tokens';

/**
 * Decorator that marks a constructor parameter as optional.
 */
export function Optional(): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const targetClass = typeof target === 'function' ? target : target.constructor;
    const existing: number[] = Reflect.getMetadata(OPTIONAL_METADATA, targetClass) ?? [];
    existing.push(parameterIndex);
    Reflect.defineMetadata(OPTIONAL_METADATA, existing, targetClass);
  };
}

Optional.getMetadata = (target: any): number[] => {
  return Reflect.getMetadata(OPTIONAL_METADATA, target) ?? [];
};
