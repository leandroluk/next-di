# React 19 Functional Patterns

`next-di` is 100% focused on modern functional React (React 18 & 19 / Server Components / Server Actions / Hooks). Legacy class components are omitted by design.

There are three idiomatic ways to consume dependencies:

---

## 1. `inject(Token)` — Server Components & Server Actions

Direct, synchronous resolution from the global container:

```tsx
// app/dashboard/page.tsx (Server Component)
import {inject} from 'next-di';
import {GetMetricsUseCase} from '#/application/usecase';

export default async function DashboardPage() {
  const metricsUseCase = inject(GetMetricsUseCase);
  const metrics = await metricsUseCase.execute();

  return <main>{metrics.totalSales}</main>;
}
```

```typescript
// app/action/checkout.action.ts (Server Action)
'use server';

import {inject} from 'next-di';
import {CheckoutUseCase} from '#/application/usecase';

export async function checkoutAction(cartId: string) {
  const checkout = inject(CheckoutUseCase);
  return await checkout.execute(cartId);
}
```

---

## 2. `useInject(Token)` — Client Components (`'use client'`)

For interactive client components, wrap the layout in `<NextDiProvider>`:

```tsx
// app/layout.tsx
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

Then in any client component:

```tsx
'use client';

import {useInject} from 'next-di/react';
import {NotificationPort} from '#/application/port';

export function AlertButton() {
  const notifier = useInject(NotificationPort);

  return <button onClick={() => notifier.notify('Clicked!')}>Notify</button>;
}
```

---

## 3. `withInject(dependencies)` — Pure Atomic Design

For presentational components that should remain **100% agnostic to DI frameworks or hooks**, use the `withInject` Higher-Order Component:

```tsx
import {withInject} from 'next-di/react';
import {AnalyticsPort} from '#/application/port';

interface AnalyticsCardProps {
  analytics: AnalyticsPort; // Pure prop!
}

// 100% pure function, trivially testable in Vitest or Storybook
function AnalyticsCardComponent({analytics}: AnalyticsCardProps) {
  return <div>Tracking active with {analytics.getProviderName()}</div>;
}

export const AnalyticsCard = withInject({
  analytics: AnalyticsPort,
})(AnalyticsCardComponent);
```
