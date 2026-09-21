import {describe, it, expect} from 'vitest';
import {NextDiContainer, ModuleScanner, forwardRef} from '../../src/core';
import {Module, Injectable} from '../../src/decorator';

describe('NextDiContainer & Module Isolation', () => {
  it('should enforce module isolation: private providers are not accessible across modules', async () => {
    @Injectable()
    class PrivateService {
      name = 'private';
    }

    @Injectable()
    class PublicService {
      name = 'public';
    }

    @Module({
      providers: [PrivateService, PublicService],
      exports: [PublicService],
    })
    class ChildModule {}

    @Injectable()
    class ConsumerService {
      constructor(public publicSvc: PublicService) {}
    }

    @Module({
      imports: [ChildModule],
      providers: [ConsumerService],
    })
    class ParentModule {}

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(ParentModule);

    const parentRef = container.getModule(ParentModule)!;
    expect(parentRef).toBeDefined();

    // PublicService is exported, should resolve
    const consumer = parentRef.get(ConsumerService);
    expect(consumer.publicSvc.name).toBe('public');

    // PrivateService is NOT exported by ChildModule, attempting to get it from parent must throw
    expect(() => parentRef.get(PrivateService)).toThrowError(/Provider 'PrivateService' not found or not exported/);
  });

  it('should resolve dependencies using abstract classes as tokens', async () => {
    abstract class DatabasePort {
      abstract query(sql: string): string;
    }

    @Injectable()
    class PostgresAdapter extends DatabasePort {
      query(sql: string): string {
        return `pg:${sql}`;
      }
    }

    @Injectable()
    class FindUserUseCase {
      constructor(public db: DatabasePort) {}
      run() {
        return this.db.query('SELECT 1');
      }
    }

    @Module({
      providers: [{provide: DatabasePort, useClass: PostgresAdapter}, FindUserUseCase],
      exports: [FindUserUseCase],
    })
    class UserModule {}

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(UserModule);

    const userModuleRef = container.getModule(UserModule)!;
    const useCase = userModuleRef.get(FindUserUseCase);

    expect(useCase.run()).toBe('pg:SELECT 1');
  });

  it('should support ValueProvider, FactoryProvider and ExistingProvider', async () => {
    abstract class ConfigPort {
      abstract env: string;
    }

    const configValue = {env: 'production'};

    @Injectable()
    class MainService {
      constructor(public config: ConfigPort) {}
    }

    abstract class AliasPort {}

    @Module({
      providers: [
        {provide: ConfigPort, useValue: configValue},
        {
          provide: 'COMPUTED_KEY',
          useFactory: (cfg: ConfigPort) => `key-for-${cfg.env}`,
          inject: [ConfigPort],
        },
        MainService,
        {provide: AliasPort, useExisting: ConfigPort},
      ],
      exports: [ConfigPort, 'COMPUTED_KEY', MainService, AliasPort],
    })
    class ConfigModule {}

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(ConfigModule);

    const moduleRef = container.getModule(ConfigModule)!;

    expect(moduleRef.get(ConfigPort)).toBe(configValue);
    expect(moduleRef.get('COMPUTED_KEY')).toBe('key-for-production');
    expect(moduleRef.get(AliasPort)).toBe(configValue);
    expect(moduleRef.get(MainService).config.env).toBe('production');
  });

  it('should support multi providers by aggregating them into an array', async () => {
    abstract class Plugin {
      abstract execute(): string;
    }

    class PluginA implements Plugin {
      execute() {
        return 'A';
      }
    }

    class PluginB implements Plugin {
      execute() {
        return 'B';
      }
    }

    @Module({
      providers: [
        {provide: Plugin, useClass: PluginA, multi: true},
        {provide: Plugin, useClass: PluginB, multi: true},
      ],
      exports: [Plugin],
    })
    class PluginModule {}

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(PluginModule);

    const plugins = container.get<Plugin[]>(Plugin);
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBe(2);
    expect(plugins.map(p => p.execute())).toEqual(['A', 'B']);
  });

  it('should support global modules without explicit imports', async () => {
    abstract class GlobalServicePort {
      abstract ping(): string;
    }

    class GlobalServiceImpl extends GlobalServicePort {
      ping() {
        return 'pong';
      }
    }

    const globalMod = {
      global: true,
      module: class GlobalModule {},
      providers: [{provide: GlobalServicePort, useClass: GlobalServiceImpl}],
      exports: [GlobalServicePort],
    };

    @Injectable()
    class ConsumerWithoutDirectImport {
      constructor(public globalSvc: GlobalServicePort) {}
    }

    @Module({
      imports: [globalMod],
    })
    class RootModule {}

    @Module({
      providers: [ConsumerWithoutDirectImport],
    })
    class OtherModule {}

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(RootModule);
    await scanner.scan(OtherModule);

    const otherRef = container.getModule(OtherModule)!;
    const consumer = otherRef.get(ConsumerWithoutDirectImport);
    expect(consumer.globalSvc.ping()).toBe('pong');
  });

  it('should handle forwardRef for circular module references', async () => {
    class ModuleBClass {}
    class ModuleAClass {}

    Module({
      imports: [forwardRef(() => ModuleBClass)],
      providers: [{provide: 'TOKEN_A', useValue: 'ValueA'}],
      exports: ['TOKEN_A'],
    })(ModuleAClass);

    Module({
      imports: [forwardRef(() => ModuleAClass)],
      providers: [{provide: 'TOKEN_B', useValue: 'ValueB'}],
      exports: ['TOKEN_B'],
    })(ModuleBClass);

    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(ModuleAClass);

    expect(container.hasModule(ModuleAClass)).toBe(true);
    expect(container.hasModule(ModuleBClass)).toBe(true);
  });
});
