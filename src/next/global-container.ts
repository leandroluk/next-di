import type {NextDiApplicationContext} from '../core/factory';

const GLOBAL_CONTAINER_KEY = Symbol.for('__NEXT_DI_CONTAINER__');

/**
 * Stores the NextDi application context in globalThis to survive HMR and Serverless chunk isolation.
 */
export function setGlobalContainer(container: NextDiApplicationContext): void {
  (globalThis as any)[GLOBAL_CONTAINER_KEY] = container;
}

/**
 * Retrieves the persisted NextDi application context.
 */
export function getGlobalContainer(): NextDiApplicationContext {
  const container = (globalThis as any)[GLOBAL_CONTAINER_KEY] as NextDiApplicationContext | undefined;
  if (!container) {
    throw new Error(
      '[NextDi] Application context has not been initialized. ' +
        'Make sure to call NextDiFactory.createApplicationContext() in your instrumentation.ts or entrypoint.'
    );
  }
  return container;
}

/**
 * Checks if the global container has been initialized.
 */
export function hasGlobalContainer(): boolean {
  return (globalThis as any)[GLOBAL_CONTAINER_KEY] !== undefined;
}

/**
 * Clears the global container (useful for test isolation).
 */
export function clearGlobalContainer(): void {
  delete (globalThis as any)[GLOBAL_CONTAINER_KEY];
}
