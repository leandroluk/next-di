import {describe, it, expect} from 'vitest';
import {AutoInjectableModule, SelectableModule, ConfigurableModule} from '../../src/factory-class';
import {InjectableAs} from '../../src/decorator/injectable-as.decorator';
import {Injectable} from '../../src/decorator/injectable.decorator';
import {Module} from '../../src/decorator/module.decorator';
import {NextDiFactory} from '../../src/core/factory';

describe('Advanced Module Factory Classes', () => {
  describe('AutoInjectableModule', () => {
    it('should automatically register and export bindings for @InjectableAs', async () => {
      abstract class PaymentPort {
        abstract pay(amount: number): string;
      }

      @InjectableAs(PaymentPort)
      @Injectable()
      class StripeAdapter extends PaymentPort {
        pay(amount: number): string {
          return `paid $${amount} with stripe`;
        }
      }

      @Module({})
      class PaymentModule extends AutoInjectableModule({
        providers: [StripeAdapter],
      }) {}

      @Injectable()
      class CheckoutService {
        constructor(public payment: PaymentPort) {}
      }

      @Module({
        imports: [PaymentModule],
        providers: [CheckoutService],
        exports: [CheckoutService],
      })
      class AppModule {}

      const app = await NextDiFactory.createApplicationContext(AppModule);
      const checkout = app.get(CheckoutService);

      expect(checkout.payment.pay(100)).toBe('paid $100 with stripe');
    });
  });

  describe('ConfigurableModule', () => {
    it('should create dynamic module with injected configuration', async () => {
      class DatabaseConfig {
        host!: string;
        port!: number;
      }

      @Injectable()
      class DbService {
        constructor(public config: DatabaseConfig) {}
      }

      @Module({})
      class DatabaseModule extends ConfigurableModule<DatabaseConfig>({
        configClass: DatabaseConfig,
        providers: [DbService],
        exports: [DbService],
      }) {}

      @Module({
        imports: [
          DatabaseModule.forRootAsync({
            useFactory: () => ({host: 'localhost', port: 5432}),
          }),
        ],
      })
      class AppModule {}

      const app = await NextDiFactory.createApplicationContext(AppModule);
      const dbService = app.get(DbService);

      expect(dbService.config.host).toBe('localhost');
      expect(dbService.config.port).toBe(5432);
    });
  });

  describe('SelectableModule', () => {
    it('should select module from selectionMap and switch implementations', async () => {
      abstract class EmailPort {
        abstract send(to: string): string;
      }

      @InjectableAs(EmailPort)
      @Injectable()
      class MockEmailAdapter extends EmailPort {
        send(to: string) {
          return `mock:${to}`;
        }
      }

      @InjectableAs(EmailPort)
      @Injectable()
      class SmtpEmailAdapter extends EmailPort {
        send(to: string) {
          return `smtp:${to}`;
        }
      }

      @Module({})
      class MockEmailModule extends AutoInjectableModule({
        providers: [MockEmailAdapter],
      }) {}

      @Module({})
      class SmtpEmailModule extends AutoInjectableModule({
        providers: [SmtpEmailAdapter],
      }) {}

      @Module({})
      class EmailModule extends SelectableModule({
        selectionMap: {
          mock: MockEmailModule,
          smtp: SmtpEmailModule,
        },
      }) {}

      @Module({
        imports: [EmailModule.forRootAsync({provider: 'mock'})],
      })
      class AppMockModule {}

      const appMock = await NextDiFactory.createApplicationContext(AppMockModule);
      const emailPortMock = appMock.get(EmailPort);
      expect(emailPortMock.send('user@test.com')).toBe('mock:user@test.com');

      @Module({
        imports: [EmailModule.forRootAsync({provider: 'smtp'})],
      })
      class AppSmtpModule {}

      const appSmtp = await NextDiFactory.createApplicationContext(AppSmtpModule);
      const emailPortSmtp = appSmtp.get(EmailPort);
      expect(emailPortSmtp.send('user@test.com')).toBe('smtp:user@test.com');
    });

    it('should throw TypeError on invalid provider key in SelectableModule', async () => {
      @Module({})
      class DummyModule {}

      @Module({})
      class TestSelectable extends SelectableModule({
        selectionMap: {
          alpha: DummyModule,
        },
      }) {}

      await expect(TestSelectable.forRootAsync({provider: 'beta' as any})).rejects.toThrowError(
        /Provedor inválido 'beta'/
      );
    });
  });
});
