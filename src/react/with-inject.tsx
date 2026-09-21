import React from 'react';
import type {InjectionToken} from '../core/tokens';
import {useNextDiContext} from './provider';

/**
 * Higher-Order Component that injects dependencies as props.
 * Keeps visual components 100% agnostic to DI frameworks and hooks for pure Atomic Design.
 */
export function withInject<TDeps extends Record<string, InjectionToken>>(dependencies: TDeps) {
  return function <TProps extends Record<string, any>>(
    Component: React.ComponentType<TProps>
  ): React.FC<Omit<TProps, keyof TDeps>> {
    const WithInjectComponent: React.FC<Omit<TProps, keyof TDeps>> = props => {
      const context = useNextDiContext();
      const resolvedDeps: Record<string, any> = {};

      for (const [key, token] of Object.entries(dependencies)) {
        resolvedDeps[key] = context.get(token);
      }

      return <Component {...(props as TProps)} {...(resolvedDeps as TProps)} />;
    };

    WithInjectComponent.displayName = `withInject(${Component.displayName || Component.name || 'Component'})`;
    return WithInjectComponent;
  };
}
