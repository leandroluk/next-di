<div align="center">
  <h1>next-di</h1>
  <p><strong>A strongly-typed, modular Dependency Injection container for Next.js inspired by NestJS</strong></p>
</div>

<br>

<div align="center">
  <a href="https://www.npmjs.com/package/next-di">
    <img src="https://img.shields.io/npm/v/next-di.svg" alt="NPM Version" />
  </a>
  <a href="https://github.com/leandroluk/next-di/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/next-di.svg" alt="License" />
  </a>
  <a href="https://github.com/leandroluk/next-di/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/leandroluk/next-di/ci.yml?branch=main" alt="CI Status" />
  </a>
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="Coverage 100%" />
  <a href="https://buymeacoffee.com/leandroluk">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" />
  </a>
</div>

<br>

A strongly-typed, decorator-driven modular Dependency Injection (IoC) library for [Next.js](https://nextjs.org/) App Router, Server Actions, and React Server Components.

📚 **[Read the Documentation](https://leandroluk.github.io/next-di)**

---

## Why this exists

In the modern Next.js ecosystem (App Router, Server Actions, React Server Components), there is **no native IoC container**. The common workarounds suffer from serious design issues:

1. **Manual Factories (`make*UseCase`)**:
   - Repetitive boilerplate functions instantiating and wiring use cases with adapters.
   - High coupling, painful refactoring, and zero scope isolation.
2. **TSyringe / Inversify**:
   - Require manual, error-prone string or symbol registration (`container.register('AuthPort', ...)`).
   - Lack declarative modular encapsulation (`@Module`), export boundaries, or dynamic modules (`forRootAsync`).
   - Were not designed for Next.js's lifecycle (Turbopack, Server Actions, RSC, and Serverless chunking).

`next-di` ports **the complete modular architecture of NestJS (`@Module`, `imports`, `providers`, `exports`, `DynamicModule`) as a first-class citizen to Next.js**, completely decoupled from heavyweight HTTP servers (Express/Fastify) and tailored for modern React 19 functional patterns.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App                           │
│  (Server Actions / Server Components / Client Components)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ get(Token) / inject(Token)    │ useInject() / withInject()
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NextDi Application                       │
│        (Persisted globally in globalThis)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│        Root Module           │ │       Dynamic Modules        │
│       (AppModule)            │ │(Selectable/Configurable)     │
└──────────────┬───────────────┘ └─────────────┬────────────────┘
               │ imports                       │ exports
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ModuleRef Graph                        │
│          (Strict scope isolation per module)                │
├─────────────────────────────────────────────────────────────┤
│  - Private Providers (not accessible from outside)          │
│  - Exported Providers (visible to consumer modules)         │
│  - Automatic Port Mapping via @InjectableAs                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- **Declarative Modules (`@Module`)**: Strict scope encapsulation via `imports`, `providers`, and `exports`.
- **Abstract Classes as Runtime Tokens**: Clean Architecture ports (`abstract class AuthPort`) act as native runtime tokens with automatic `design:paramtypes` constructor injection.
- **Auto-Declaration with `@InjectableAs`**: Adapters declare which port they implement; the container registers the alias and exports the port automatically.
- **Advanced Module Factories**: Ported from production backend architectures:
  - `AutoInjectableModule`: Auto-binding of ports from `@InjectableAs`.
  - `SelectableModule`: Type-safe dynamic switching between drivers via `selectionMap`.
  - `ConfigurableModule`: Async configuration modules via `forRootAsync` and `useFactory`.
- **100% Functional React 19**:
  - `inject(Token)` / `get(Token)`: Synchronous resolution in Server Actions and RSC.
  - `useInject(Token)`: Idiomatic hook for Client Components.
  - `withInject(deps)(Component)`: HOC for pure Atomic Design.
- **Serverless & HMR Resilient**: Singleton container persistence in `globalThis` to survive route chunking and Fast Refresh.
- **Full Next.js Integration**: `withNextDi` plugin for `next.config.ts` and `registerNextDi` for `instrumentation.ts`.
- **Circular Dependency Support**: Built-in `forwardRef(() => Target)` resolution.

---

## Requirements

- Node.js ≥ 20
- Next.js ≥ 14
- React ≥ 18 / 19
- TypeScript with `experimentalDecorators: true` and `emitDecoratorMetadata: true`

---

## Get started

### 1. Installation

```bash
pnpm add next-di reflect-metadata
```

### 2. Configure `tsconfig.json`

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

### 3. Configure `next.config.ts`

```typescript
import {withNextDi} from 'next-di/next';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // your configuration
};

export default withNextDi({
  entry: './src/main.ts',
})(nextConfig);
```

### 4. Bootstrap in `src/main.ts` and `src/instrumentation.ts`

```typescript
// src/main.ts
import {NextDiFactory} from 'next-di';
import {AppModule} from './app.module';

export async function bootstrap() {
  return await NextDiFactory.createApplicationContext(AppModule);
}
```

```typescript
// src/instrumentation.ts
import {registerNextDi} from 'next-di/next';
import {bootstrap} from './main';

export async function register() {
  await registerNextDi(bootstrap);
}
```

---

## Clean Architecture Walkthrough

### 1. Port (Application Layer)

Use an `abstract class` as a runtime token:

```typescript
// src/module/auth/port/auth.port.ts
export abstract class AuthPort {
  abstract sendOtp(email: string): Promise<void>;
  abstract verifyOtp(email: string, code: string): Promise<{accessToken: string}>;
}
```

### 2. Adapter (Infrastructure Layer)

Decorate with `@InjectableAs(Port)` and `@Injectable()`:

```typescript
// src/module/auth/adapter/fetch-auth.adapter.ts
import {Injectable, InjectableAs} from 'next-di';
import {AuthPort} from '../port/auth.port';

@InjectableAs(AuthPort)
@Injectable()
export class FetchAuthAdapter extends AuthPort {
  async sendOtp(email: string): Promise<void> {
    await fetch('/api/otp', {method: 'POST', body: JSON.stringify({email})});
  }

  async verifyOtp(email: string, code: string): Promise<{accessToken: string}> {
    const res = await fetch('/api/verify', {method: 'POST', body: JSON.stringify({email, code})});
    return res.json();
  }
}
```

### 3. Use Case

```typescript
// src/module/auth/usecase/login.usecase.ts
import {Injectable} from 'next-di';
import {AuthPort} from '../port/auth.port';

@Injectable()
export class LoginUseCase {
  constructor(private readonly auth: AuthPort) {} // Injected automatically!

  async execute(email: string, code: string) {
    return await this.auth.verifyOtp(email, code);
  }
}
```

### 4. Module Declaration

Using `AutoInjectableModule`, the port binding and export are created automatically:

```typescript
// src/module/auth/auth.module.ts
import {Module, AutoInjectableModule} from 'next-di';
import {FetchAuthAdapter} from './adapter/fetch-auth.adapter';
import {LoginUseCase} from './usecase/login.usecase';

@Module({})
export class AuthModule extends AutoInjectableModule({
  providers: [FetchAuthAdapter, LoginUseCase],
  exports: [LoginUseCase],
}) {}
```

```typescript
// src/app.module.ts
import {Module} from 'next-di';
import {AuthModule} from './module/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

---

## Consuming in React & Next.js

### Server Actions

```typescript
// src/action/auth.action.ts
'use server';

import {inject} from 'next-di';
import {LoginUseCase} from '#/module/auth/usecase/login.usecase';
import {cookies} from 'next/headers';

export async function loginAction(email: string, code: string) {
  const login = inject(LoginUseCase);
  const result = await login.execute(email, code);

  const cookieStore = await cookies();
  cookieStore.set('session', result.accessToken, {httpOnly: true});
  return {success: true};
}
```

### Server Components (RSC)

```tsx
// src/app/profile/page.tsx
import {inject} from 'next-di';
import {GetProfileUseCase} from '#/module/user/usecase';

export default async function ProfilePage() {
  const profile = await inject(GetProfileUseCase).execute();
  return <h1>Hello, {profile.name}</h1>;
}
```

### Client Components (`'use client'`)

Wrap your root layout with `<NextDiProvider>`:

```tsx
// src/app/layout.tsx
import {NextDiProvider} from 'next-di/react';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <NextDiProvider>{children}</NextDiProvider>
      </body>
    </html>
  );
}
```

And consume via hook:

```tsx
'use client';

import {useInject} from 'next-di/react';
import {AuthPort} from '#/module/auth/port/auth.port';

export function QuickLoginButton({email}: {email: string}) {
  const auth = useInject(AuthPort);
  return <button onClick={() => auth.sendOtp(email)}>Send Code</button>;
}
```

### Pure Atomic Design (`withInject`)

Keep visual components 100% agnostic to DI frameworks or hooks:

```tsx
import {withInject} from 'next-di/react';
import {AnalyticsPort} from '#/module/analytics/port';

interface MetricsCardProps {
  analytics: AnalyticsPort; // Pure prop!
}

function MetricsCardComponent({analytics}: MetricsCardProps) {
  return <div>Active provider: {analytics.getName()}</div>;
}

export const MetricsCard = withInject({
  analytics: AnalyticsPort,
})(MetricsCardComponent);
```

---

## Dynamic & Selectable Modules

### `SelectableModule` (Switching Drivers)

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

// In AppModule:
@Module({
  imports: [
    AuthModule.forRootAsync({
      provider: process.env.NEXT_PUBLIC_AUTH === 'mock' ? 'mock' : 'fetch',
    }),
  ],
})
export class AppModule {}
```

### `ConfigurableModule` (Async Configuration)

```typescript
import {Module, ConfigurableModule} from 'next-di';

export class DatabaseConfig {
  host!: string;
  port!: number;
}

@Module({})
export class DatabaseModule extends ConfigurableModule<DatabaseConfig>({
  configClass: DatabaseConfig,
  providers: [DatabaseService],
  exports: [DatabaseService],
}) {}

// In AppModule:
@Module({
  imports: [
    DatabaseModule.forRootAsync({
      global: true,
      useFactory: () => ({host: process.env.DB_HOST!, port: 5432}),
    }),
  ],
})
export class AppModule {}
```

---

## API Reference

### Core Decorators (`next-di`)

| Decorator                       | Target    | Description                                                                             |
| ------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| `@Module(metadata)`             | Class     | Declares a module with `imports`, `providers`, `exports`, and optional `controllers`.   |
| `@Injectable(options?)`         | Class     | Marks a class as injectable with optional scope (`singleton` / `transient`).            |
| `@InjectableAs(Port, options?)` | Class     | Declares that an adapter implements one or more Ports, with optional `{ multi: true }`. |
| `@Inject(token)`                | Parameter | Explicitly specifies the token to inject into a constructor parameter.                  |
| `@Optional()`                   | Parameter | Marks a constructor parameter as optional (`undefined` if not resolved).                |

### Factory Classes (`next-di`)

| Class                  | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `AutoInjectableModule` | Scans providers for `@InjectableAs`, creating bindings and auto-exporting ports. |
| `SelectableModule`     | Provides `forRootAsync` with dynamic driver switching via `selectionMap`.        |
| `ConfigurableModule`   | Provides typed async configuration with `forRootAsync` and `useFactory`.         |

### React Helpers (`next-di/react`)

| Export                        | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `<NextDiProvider>`            | Context provider for Client Components.                        |
| `useInject(token)`            | Hook resolving a token inside Client Components.               |
| `withInject(deps)(Component)` | HOC injecting resolved tokens as props for pure Atomic Design. |

### Next.js & Server Helpers (`next-di/next`)

| Export                      | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `withNextDi(options)`       | Plugin wrapper for `next.config.ts`.                                    |
| `registerNextDi(bootstrap)` | Helper connecting bootstrap to Next.js `instrumentation.ts register()`. |
| `getGlobalContainer()`      | Accesses the persisted singleton application context.                   |

---

## License

[MIT](LICENSE) © [Leandro Luk](https://github.com/leandroluk)
