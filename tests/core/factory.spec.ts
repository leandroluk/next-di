import {describe, it, expect} from 'vitest';
import {NextDiFactory, type DynamicModule} from '../../src/core';
import {Module, Injectable} from '../../src/decorator';

describe('NextDiFactory & Dynamic Modules', () => {
  it('should create application context from root module and resolve dependencies', async () => {
    @Injectable()
    class AppService {
      getHello() {
        return 'Hello NextDi';
      }
    }

    @Module({
      providers: [AppService],
      exports: [AppService],
    })
    class AppModule {}

    const app = await NextDiFactory.createApplicationContext(AppModule);
    expect(app).toBeDefined();

    const service = app.get(AppService);
    expect(service.getHello()).toBe('Hello NextDi');

    const moduleRef = app.select(AppModule);
    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(AppService)).toBe(service);
  });

  it('should support dynamic modules via static forRoot and forRootAsync methods', async () => {
    interface ConfigOptions {
      apiUrl: string;
    }

    abstract class ApiClientPort {
      abstract getUrl(): string;
    }

    class ApiClientImpl extends ApiClientPort {
      constructor(private readonly options: ConfigOptions) {
        super();
      }
      getUrl() {
        return this.options.apiUrl;
      }
    }

    @Module({})
    class DynamicClientModule {
      static forRoot(options: ConfigOptions): DynamicModule {
        return {
          module: DynamicClientModule,
          providers: [
            {
              provide: ApiClientPort,
              useValue: new ApiClientImpl(options),
            },
          ],
          exports: [ApiClientPort],
        };
      }

      static async forRootAsync(optionsFactory: () => Promise<ConfigOptions>): Promise<DynamicModule> {
        const options = await optionsFactory();
        return {
          module: DynamicClientModule,
          providers: [
            {
              provide: ApiClientPort,
              useValue: new ApiClientImpl(options),
            },
          ],
          exports: [ApiClientPort],
        };
      }
    }

    @Module({
      imports: [
        DynamicClientModule.forRootAsync(async () => ({
          apiUrl: 'https://api.example.com',
        })),
      ],
    })
    class AppModuleAsync {}

    const app = await NextDiFactory.createApplicationContext(AppModuleAsync);
    const client = app.get(ApiClientPort);
    expect(client.getUrl()).toBe('https://api.example.com');
  });
});
