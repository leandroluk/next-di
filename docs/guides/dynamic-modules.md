# Dynamic & Selectable Modules

`next-di` brings the full power of NestJS dynamic modules and advanced factory patterns to Next.js.

## 1. Canonical `DynamicModule` (`forRoot` / `forRootAsync`)

A module can return a `DynamicModule` definition:

```typescript
import {Module, type DynamicModule} from 'next-di';

export interface CacheOptions {
  ttl: number;
}

@Module({})
export class CacheModule {
  static forRoot(options: CacheOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options,
        },
        CacheService,
      ],
      exports: [CacheService],
      global: true,
    };
  }
}
```

---

## 2. `ConfigurableModule`

Provides a typed, asynchronous configuration pattern using a configuration class:

```typescript
import {Module, ConfigurableModule} from 'next-di';

export class RedisConfig {
  host!: string;
  port!: number;
}

@Module({})
export class RedisModule extends ConfigurableModule<RedisConfig>({
  configClass: RedisConfig,
  providers: [RedisService],
  exports: [RedisService],
}) {}
```

Importing with asynchronous factory:

```typescript
@Module({
  imports: [
    RedisModule.forRootAsync({
      global: true,
      useFactory: () => ({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      }),
    }),
  ],
})
export class AppModule {}
```

---

## 3. `SelectableModule`

Enables switching between multiple implementations (e.g. `mock` vs `live`, `stripe` vs `paypal`) through a single declarative entry point:

```typescript
import {Module, SelectableModule} from 'next-di';
import {AuthMockModule} from './mock/auth-mock.module';
import {AuthFetchModule} from './fetch/auth-fetch.module';

@Module({})
export class AuthModule extends SelectableModule({
  selectionMap: {
    mock: AuthMockModule,
    fetch: AuthFetchModule,
  },
}) {}
```

Consuming in the root module:

```typescript
@Module({
  imports: [
    AuthModule.forRootAsync({
      provider: process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'mock' ? 'mock' : 'fetch',
    }),
  ],
})
export class AppModule {}
```
