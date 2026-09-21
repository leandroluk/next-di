import type {NextDiApplicationContext} from '../core/factory';
import {setGlobalContainer} from './global-container';

/**
 * Connects the NextDi bootstrap function to Next.js's instrumentation.ts register() hook.
 *
 * @example
 * ```ts
 * // src/instrumentation.ts
 * import { registerNextDi } from 'next-di/next';
 * import { bootstrap } from './main';
 *
 * export async function register() {
 *   await registerNextDi(bootstrap);
 * }
 * ```
 */
export async function registerNextDi(
  bootstrapFn: () => Promise<NextDiApplicationContext>
): Promise<NextDiApplicationContext> {
  const context = await bootstrapFn();
  setGlobalContainer(context);
  return context;
}
