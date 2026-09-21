# Next.js & Serverless Lifecycle

## The Serverless Isolation Challenge

In Next.js production deployments (Vercel, AWS Lambda, Docker standalone):

1. **Route chunking**: Each Server Action or Route Handler can execute in a separate JS chunk or isolated worker.
2. **Fast Refresh / HMR**: In local development, modules are re-evaluated frequently.

If the IoC container were recompiled on every request, singletons would be lost and startup latency would degrade response times.

---

## 1. `globalThis` Persistence

`next-di` maintains the root container singleton on `globalThis`:

```typescript
const GLOBAL_KEY = Symbol.for('__NEXT_DI_CONTAINER__');
```

This guarantees that:

- Any Server Action, RSC, or Route Handler in the same Node.js worker shares the exact same singleton instance.
- Development HMR reuses existing singletons without memory leaks.

---

## 2. Server Initialization Hook (`src/instrumentation.ts`)

Next.js provides a native `instrumentation.ts` hook that runs exactly once when the server boots up:

```typescript
// src/instrumentation.ts
import {registerNextDi} from 'next-di/next';
import {bootstrap} from './main';

export async function register() {
  await registerNextDi(bootstrap);
}
```

```typescript
// src/main.ts
import {NextDiFactory} from 'next-di';
import {AppModule} from './app.module';

export async function bootstrap() {
  return await NextDiFactory.createApplicationContext(AppModule);
}
```

---

## 3. Next.js Config Plugin (`withNextDi`)

The `withNextDi` wrapper in `next.config.ts` automatically configures the server runtime:

```typescript
// next.config.ts
import {withNextDi} from 'next-di/next';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // your Next.js configuration
};

export default withNextDi({
  entry: './src/main.ts',
})(nextConfig);
```
