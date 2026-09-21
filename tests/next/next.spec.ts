import {describe, it, expect, beforeEach} from 'vitest';
import {withNextDi, registerNextDi} from '../../src/next';
import {clearGlobalContainer, hasGlobalContainer, getGlobalContainer} from '../../src/next/global-container';
import {NextDiFactory} from '../../src/core/factory';
import {Module} from '../../src/decorator/module.decorator';
import {Injectable} from '../../src/decorator/injectable.decorator';

describe('Next.js Integration (withNextDi & registerNextDi)', () => {
  beforeEach(() => {
    clearGlobalContainer();
  });

  it('withNextDi should configure experimental.instrumentationHook and preserve custom settings', () => {
    const customConfig = {
      reactStrictMode: true,
      experimental: {
        typedRoutes: true,
      },
      webpack: (config: any) => config,
    };

    const enhanced = withNextDi({entry: './src/main.ts'})(customConfig);

    expect(enhanced.reactStrictMode).toBe(true);
    expect(enhanced.experimental.typedRoutes).toBe(true);
    expect(enhanced.experimental.instrumentationHook).toBe(true);
    expect(typeof enhanced.webpack).toBe('function');
  });

  it('registerNextDi should bootstrap application and store in global container', async () => {
    @Injectable()
    class ServerService {
      status() {
        return 'online';
      }
    }

    @Module({
      providers: [ServerService],
      exports: [ServerService],
    })
    class RootModule {}

    async function bootstrap() {
      return NextDiFactory.createApplicationContext(RootModule);
    }

    expect(hasGlobalContainer()).toBe(false);

    const app = await registerNextDi(bootstrap);
    expect(hasGlobalContainer()).toBe(true);
    expect(getGlobalContainer()).toBe(app);

    const svc = app.get(ServerService);
    expect(svc.status()).toBe('online');
  });
});
