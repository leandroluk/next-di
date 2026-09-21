export interface WithNextDiOptions {
  entry?: string;
}

/**
 * Next.js config plugin that configures the compiler and lifecycle for NextDi.
 *
 * @example
 * ```ts
 * // next.config.ts
 * import { withNextDi } from 'next-di/next';
 *
 * export default withNextDi({
 *   entry: './src/main.ts',
 * })({
 *   // your Next.js config
 * });
 * ```
 */
export function withNextDi(_options: WithNextDiOptions = {}) {
  return function nextDiPlugin(nextConfig: Record<string, any> = {}): Record<string, any> {
    const experimental = {
      ...(nextConfig.experimental || {}),
      instrumentationHook: true,
    };

    const webpackConfig = nextConfig.webpack;

    return {
      ...nextConfig,
      experimental,
      webpack(config: any, context: any) {
        // Ensure experimentalDecorators and emitDecoratorMetadata are handled
        if (typeof webpackConfig === 'function') {
          return webpackConfig(config, context);
        }
        return config;
      },
    };
  };
}
