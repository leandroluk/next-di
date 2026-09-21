import React, {createContext, useContext, type ReactNode} from 'react';
import type {NextDiApplicationContext} from '../core/factory';
import {getGlobalContainer, hasGlobalContainer} from '../next/global-container';

export const NextDiContext = createContext<NextDiApplicationContext | null>(null);

export interface NextDiProviderProps {
  context?: NextDiApplicationContext;
  children: ReactNode;
}

/**
 * Provider component for React Client Components.
 * Makes the NextDi application context available via React Context.
 */
export function NextDiProvider({context, children}: NextDiProviderProps): React.JSX.Element {
  const resolvedContext = context ?? (hasGlobalContainer() ? getGlobalContainer() : null);

  return <NextDiContext.Provider value={resolvedContext}>{children}</NextDiContext.Provider>;
}

/**
 * Hook to access the NextDiApplicationContext directly.
 */
export function useNextDiContext(): NextDiApplicationContext {
  const ctx = useContext(NextDiContext);
  if (ctx) {
    return ctx;
  }
  if (hasGlobalContainer()) {
    return getGlobalContainer();
  }
  throw new Error(
    '[NextDi] No NextDiApplicationContext found. Ensure components are wrapped with <NextDiProvider> or global container is initialized.'
  );
}
