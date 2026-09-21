import {INJECTABLE_WATERMARK} from '../core/tokens';

export interface InjectableOptions {
  scope?: 'singleton' | 'transient';
}

/**
 * Decorator that marks a class as available to be provided and injected as a dependency.
 */
export function Injectable(options?: InjectableOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target);
    if (options?.scope) {
      Reflect.defineMetadata('next-di:scope', options.scope, target);
    }
  };
}
