# Full Auth Module Walkthrough

This example demonstrates how to build a complete Authentication module using Clean Architecture, `@InjectableAs`, and Next.js Server Actions.

---

## 1. Defining the Port (Application Layer)

```typescript
// src/module/auth/port/auth.port.ts
export interface UserTokens {
  accessToken: string;
  refreshToken: string;
}

export abstract class AuthPort {
  abstract sendOtp(email: string): Promise<{success: boolean}>;
  abstract loginWithOtp(email: string, code: string): Promise<UserTokens>;
}
```

---

## 2. Implementing the Adapter (Infrastructure Layer)

```typescript
// src/module/auth/adapter/fetch-auth.adapter.ts
import {Injectable, InjectableAs} from 'next-di';
import {AuthPort, type UserTokens} from '../port/auth.port';

@InjectableAs(AuthPort)
@Injectable()
export class FetchAuthAdapter extends AuthPort {
  async sendOtp(email: string): Promise<{success: boolean}> {
    const res = await fetch('https://auth.api.internal/otp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email}),
    });
    return res.json();
  }

  async loginWithOtp(email: string, code: string): Promise<UserTokens> {
    const res = await fetch('https://auth.api.internal/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, code}),
    });
    return res.json();
  }
}
```

---

## 3. Defining Use Cases

```typescript
// src/module/auth/usecase/login-with-otp.usecase.ts
import {Injectable} from 'next-di';
import {AuthPort} from '../port/auth.port';

@Injectable()
export class LoginWithOtpUseCase {
  constructor(private readonly auth: AuthPort) {}

  async execute(email: string, code: string) {
    if (!email || !code) {
      throw new Error('Email and code are required');
    }
    return await this.auth.loginWithOtp(email, code);
  }
}
```

---

## 4. Declaring the Module

Using `AutoInjectableModule`, `FetchAuthAdapter` is automatically bound to `AuthPort` and exported:

```typescript
// src/module/auth/auth.module.ts
import {Module, AutoInjectableModule} from 'next-di';
import {FetchAuthAdapter} from './adapter/fetch-auth.adapter';
import {LoginWithOtpUseCase} from './usecase/login-with-otp.usecase';

@Module({})
export class AuthModule extends AutoInjectableModule({
  providers: [FetchAuthAdapter, LoginWithOtpUseCase],
  exports: [LoginWithOtpUseCase],
}) {}
```

---

## 5. Consuming in a Next.js Server Action

```typescript
// src/action/auth.action.ts
'use server';

import {inject} from 'next-di';
import {LoginWithOtpUseCase} from '#/module/auth/usecase/login-with-otp.usecase';
import {cookies} from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const code = formData.get('code') as string;

  const loginUseCase = inject(LoginWithOtpUseCase);
  const tokens = await loginUseCase.execute(email, code);

  const cookieStore = await cookies();
  cookieStore.set('session', tokens.accessToken, {httpOnly: true, secure: true});

  return {success: true};
}
```
