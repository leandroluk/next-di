# Clean Architecture & Runtime Tokens

In typical Clean Architecture, your application layer depends on abstractions (Ports) rather than concrete implementations (Adapters).

## The Runtime Token Dilemma in TypeScript

In standard TypeScript, `interface` definitions are completely erased at compile time:

```typescript
// Erased at runtime! Cannot be injected directly without a string token
export interface AuthPort {
  login(email: string): Promise<User>;
}
```

Libraries like TSyringe or Inversify solve this with string or symbol tokens:

```typescript
// Verbose and error-prone
container.register('AuthPort', { useClass: FetchAuthAdapter });

@inject('AuthPort')
private authPort: AuthPort;
```

## The NextDi Solution: Abstract Classes as Tokens

In `next-di`, Ports are defined as `abstract class`:

```typescript
export abstract class AuthPort {
  abstract sendOtp(email: string): Promise<void>;
  abstract verifyOtp(email: string, code: string): Promise<{accessToken: string}>;
}
```

### Why Abstract Classes?

1. **Preserved at Runtime**: An `abstract class` compiles into a JavaScript constructor function.
2. **Automatic Constructor Metadata**: TypeScript natively emits `design:paramtypes: [AuthPort]` for classes that consume it:
   ```typescript
   @Injectable()
   export class LoginUseCase {
     constructor(private readonly auth: AuthPort) {} // No @Inject needed!
   }
   ```
3. **Refactor Safety**: Renaming the port class automatically updates all references with full IDE safety.

---

## Auto-Declaration with `@InjectableAs`

Instead of manually configuring provider maps in modules, adapters declare which port they implement:

```typescript
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

When placed inside an `AutoInjectableModule`, `next-di` automatically registers:

```typescript
{ provide: AuthPort, useExisting: FetchAuthAdapter }
```

and automatically adds `AuthPort` to the module's `exports`.
