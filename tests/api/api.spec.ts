import {describe, it, expect, beforeEach} from 'vitest';
import {get, inject} from '../../src/api';
import {setGlobalContainer, clearGlobalContainer, hasGlobalContainer} from '../../src/next/global-container';
import {NextDiFactory} from '../../src/core/factory';
import {Module} from '../../src/decorator/module.decorator';
import {Injectable} from '../../src/decorator/injectable.decorator';

describe('Global Container & API Helpers (get, inject)', () => {
  beforeEach(() => {
    clearGlobalContainer();
  });

  it('should throw error when container is not initialized', () => {
    class DummyService {}
    expect(() => get(DummyService)).toThrowError(/Application context has not been initialized/);
    expect(() => inject(DummyService)).toThrowError(/Application context has not been initialized/);
    expect(hasGlobalContainer()).toBe(false);
  });

  it('should resolve dependencies via get() and inject() when container is set', async () => {
    @Injectable()
    class GreeterService {
      greet(name: string) {
        return `Hello, ${name}!`;
      }
    }

    @Module({
      providers: [GreeterService],
      exports: [GreeterService],
    })
    class AppModule {}

    const app = await NextDiFactory.createApplicationContext(AppModule);
    setGlobalContainer(app);

    expect(hasGlobalContainer()).toBe(true);

    const fromGet = get(GreeterService);
    const fromInject = inject(GreeterService);

    expect(fromGet).toBe(fromInject);
    expect(fromGet.greet('Next.js')).toBe('Hello, Next.js!');
  });
});
