# Server Components & Atomic Design

This example demonstrates how to integrate Server Components and presentational components using pure Atomic Design and `withInject`.

---

## 1. Server Component (RSC) Direct Resolution

In React Server Components, there is no need for hooks or contexts. Use `inject(UseCase)` directly in the component body:

```tsx
// src/app/dashboard/page.tsx
import {inject} from 'next-di';
import {GetCustomerDashboardUseCase} from '#/module/dashboard/usecase';
import {CustomerDashboardView} from './dashboard-view';

export default async function DashboardPage() {
  const dashboardUseCase = inject(GetCustomerDashboardUseCase);
  const data = await dashboardUseCase.execute();

  return <CustomerDashboardView data={data} />;
}
```

---

## 2. Presentational Component with `withInject`

To maintain pure Atomic Design where components receive services via props and can be tested in isolation:

```tsx
// src/presentation/component/billing-card.tsx
import {withInject} from 'next-di/react';
import {InvoicePort} from '#/module/billing/port';

interface BillingCardProps {
  invoiceId: string;
  invoicePort: InvoicePort; // Injected as a prop
}

function BillingCardComponent({invoiceId, invoicePort}: BillingCardProps) {
  const handlePay = async () => {
    await invoicePort.pay(invoiceId);
  };

  return (
    <div className="card">
      <button onClick={handlePay}>Pay Now</button>
    </div>
  );
}

// Wrapped HOC export
export const BillingCard = withInject({
  invoicePort: InvoicePort,
})(BillingCardComponent);
```

### Unit Testing Without NextDi:

Because `BillingCardComponent` is just a pure function:

```typescript
// tests/billing-card.spec.tsx
import { render, screen } from '@testing-library/react';
import { BillingCardComponent } from './billing-card';

it('renders pay button', () => {
  const mockPort = { pay: vi.fn() };
  render(<BillingCardComponent invoiceId="123" invoicePort={mockPort as any} />);
  expect(screen.getByText('Pay Now')).toBeDefined();
});
```
