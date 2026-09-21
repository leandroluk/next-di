import type {ForwardReference} from './tokens';

/**
 * Creates a forward reference to a module or provider to resolve circular dependencies.
 */
export function forwardRef<T = any>(fn: () => T): ForwardReference<T> {
  return {
    forwardRef: fn,
  };
}

export function isForwardRef(value: any): value is ForwardReference {
  return value !== null && typeof value === 'object' && typeof value.forwardRef === 'function';
}
