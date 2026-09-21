import type {InjectionToken} from '../core/tokens';
import {useNextDiContext} from './provider';

/**
 * React hook to resolve dependencies inside Client Components ('use client').
 */
export function useInject<T = any>(token: InjectionToken<T>): T {
  const context = useNextDiContext();
  return context.get(token);
}
