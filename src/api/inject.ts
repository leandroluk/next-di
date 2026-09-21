import type {InjectionToken} from '../core/tokens';
import {getGlobalContainer} from '../next/global-container';

/**
 * Resolves a dependency synchronously from the global NextDi container.
 * Inspired by Angular's standalone inject() function, designed for React Server Components and Server Actions.
 */
export function inject<T = any>(token: InjectionToken<T>): T {
  return getGlobalContainer().get(token);
}
