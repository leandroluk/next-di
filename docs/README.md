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

## Why this exists

In modern Next.js (App Router, Server Actions, React Server Components), there is **no native IoC container**. Teams typically resort to two flawed approaches:

1. **Manual Factories (`make*UseCase`)**:
   - Endless boilerplate functions instantiating and wiring use cases with adapters.
   - High coupling, painful refactoring, and zero encapsulation.
2. **TSyringe / Inversify**:
   - Require manual, error-prone string/symbol registration (`container.register('AuthPort', ...)`).
   - Lack declarative modular encapsulation (`@Module`), export boundaries, or dynamic modules (`forRootAsync`).
   - Were not designed for Next.js's lifecycle (Turbopack, Server Actions, RSC, and Serverless chunking).

`next-di` ports **the complete modular architecture of NestJS (`@Module`, `imports`, `providers`, `exports`, `DynamicModule`) as a first-class citizen to Next.js**, completely decoupled from heavyweight HTTP servers (Express/Fastify) and tailored for modern React 19 functional patterns.

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

## Quick Start

### 1. Installation

```bash
pnpm add next-di reflect-metadata
```

### 2. Configure `tsconfig.json`

Ensure decorator metadata is enabled:

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

Wrap your Next.js configuration with `withNextDi`:

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

### 4. Bootstrap the Application

Create `src/main.ts`:

```typescript
import {NextDiFactory} from 'next-di';
import {AppModule} from './app.module';

export async function bootstrap() {
  return await NextDiFactory.createApplicationContext(AppModule);
}
```

And connect it to Next.js in `src/instrumentation.ts`:

```typescript
import {registerNextDi} from 'next-di/next';
import {bootstrap} from './main';

export async function register() {
  await registerNextDi(bootstrap);
}
```

---

## Core Usage

### Defining Ports and Adapters

```typescript
// src/module/auth/port/auth.port.ts
export abstract class AuthPort {
  abstract sendOtp(email: string): Promise<void>;
  abstract verifyOtp(email: string, code: string): Promise<{token: string}>;
}
```

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

  async verifyOtp(email: string, code: string): Promise<{token: string}> {
    const res = await fetch('/api/verify', {method: 'POST', body: JSON.stringify({email, code})});
    return res.json();
  }
}
```

### Declaring Use Cases

```typescript
// src/module/auth/usecase/login.usecase.ts
import {Injectable} from 'next-di';
import {AuthPort} from '../port/auth.port';

@Injectable()
export class LoginUseCase {
  constructor(private readonly auth: AuthPort) {}

  async execute(email: string, code: string) {
    return await this.auth.verifyOtp(email, code);
  }
}
```

### Declaring Modules

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

## Consuming Dependencies

### In Server Actions

```typescript
'use server';

import {inject} from 'next-di';
import {LoginUseCase} from '#/module/auth/usecase/login.usecase';

export async function loginAction(email: string, code: string) {
  const login = inject(LoginUseCase);
  return await login.execute(email, code);
}
```

### In Server Components

```tsx
import {inject} from 'next-di';
import {GetProfileUseCase} from '#/module/user/usecase';

export default async function ProfilePage() {
  const profile = await inject(GetProfileUseCase).execute();
  return <h1>Welcome, {profile.name}</h1>;
}
```

### In Client Components

```tsx
'use client';

import {useInject} from 'next-di/react';
import {AuthPort} from '#/module/auth/port/auth.port';

export function OtpButton({email}: {email: string}) {
  const auth = useInject(AuthPort);
  return <button onClick={() => auth.sendOtp(email)}>Send Code</button>;
}
```

---

## API Reference

### Decorators (`next-di`)

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
