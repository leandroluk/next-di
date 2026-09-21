import type {InjectionToken} from '../core/tokens';
import {getGlobalContainer} from '../next/global-container';

/**
 * Resolves a dependency from the global NextDi container.
 * Intended for use in Server Actions, Route Handlers, and Server Components.
 */
export function get<T = any>(token: InjectionToken<T>): T {
  return getGlobalContainer().get(token);
}
