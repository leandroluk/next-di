# next-di — Architecture & Technical Insights

> **Documento de especificação técnica e decisões arquiteturais para o desenvolvimento da biblioteca `next-di`.**  
> Elaborado para guiar qualquer sessão de desenvolvimento ou agente que assumir a implementação deste repositório.

---

## 1. Visão Geral e Motivação

### 1.1. O Problema Atual no Next.js

No ecossistema Next.js (App Router, Server Actions e React Server Components), **não existe um container de Injeção de Dependência (IoC) nativo**. As abordagens comuns no mercado hoje sofrem de problemas graves:

1. **Fábricas Manuais (`make*UseCase`)**:
   - Criação manual e repetitiva de funções para instanciar e conectar cada use case com seus adaptadores.
   - Muito boilerplate, acoplamento na camada de inicialização e refatorações trabalhosas.
2. **TSyringe / Inversify**:
   - Exigem registro imperativo manual com strings ou símbolos (`container.register('Port', { useClass: ... })`).
   - Não possuem o conceito de **Módulos declarativos** (`@Module`), isolamento de escopo por módulo (`exports`), nem módulos dinâmicos (`forRootAsync`).
   - Não foram desenhados para o ciclo de vida do Next.js (Turbopack, SWC, RSC, Server Actions e Serverless chunking).

### 1.2. O Objetivo do `next-di`

O objetivo da biblioteca **`next-di`** é portar **a arquitetura modular completa do NestJS (`@Module`, `imports`, `providers`, `exports`, `DynamicModule`) como cidadã de primeira classe para o Next.js**, permitindo:

- Configurar o Next.js com um wrapper simples no `next.config.js` (`withNextDi`).
- Bootstrapar a aplicação inteira através de um arquivo `src/main.ts`.
- Declarar dependências através de **Módulos (`@Module`)** e **Classes Abstratas como Tokens de Runtime**.
- Resolver Casos de Uso diretamente em Server Actions, Route Handlers e Server Components via `get(UseCase)` ou `inject(UseCase)`.

---

## 2. Princípios de Design e Inspiração no NestJS

A arquitetura do `next-di` se baseia diretamente nas abstrações bem-sucedidas desenvolvidas no backend em `pkgs/nest-core` do projeto `leandroluk/metha`:

### 2.1. Tokens de Runtime via Classes Abstratas

Em vez de strings mágicas (`'AuthPort'`) ou `Symbol()`, os Ports de Clean Architecture utilizam `abstract class`:

```typescript
export abstract class AuthPort {
  abstract sendOtp(payload: AuthOtpBodyDto): Promise<ActionResponse>;
  abstract loginWithOtp(payload: AuthLoginBodyDto): Promise<AuthLoginResponseDto>;
}
```

_Vantagem_: No JavaScript compilado, a classe abstrata existe em runtime como uma função construtora. O TypeScript emite nativamente `design:paramtypes: [AuthPort]` no construtor que a consome.

### 2.2. Auto-Declaração de Implementação (`@InjectableAs`)

O adapter se decora dizendo qual porta ele implementa:

```typescript
@InjectableAs(AuthPort)
@Injectable()
export class FetchAuthAdapter implements AuthPort {
  // implementação
}
```

O container analisa o metadado e cria o binding `provide: AuthPort, useExisting: FetchAuthAdapter` automaticamente, **sem necessidade de registros manuais imperativos**.

### 2.3. Módulos Dinâmicos e Selecionáveis (`SelectableModule` / `ConfigurableModule`)

Suporte nativo a módulos dinâmicos assíncronos que chaveiam provedores (ex: chavear entre `mock` e `fetch` ou `jwt` e `oidc`):

```typescript
@Module({})
export class AuthModule extends SelectableModule({
  selectionMap: {
    mock: AuthMockModule,
    fetch: AuthFetchModule,
  },
}) {}
```

---

## 3. Experiência de Desenvolvimento (DX) Alvo

### 3.1. Configuração no Next.js (`next.config.ts`)

```typescript
import {withNextDi} from 'next-di';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Configurações do Next.js
};

export default withNextDi({
  entry: './src/main.ts',
})(nextConfig);
```

**O que o `withNextDi` faz por baixo dos panos:**

1. **Compilador SWC / Turbopack**:
   - Garante a preservação de metadados de decorators (`experimentalDecorators: true`, `emitDecoratorMetadata: true`).
2. **Ciclo de Vida do Next.js (`instrumentation.ts`)**:
   - Conecta a execução do `main.ts` ao hook nativo `instrumentation.register()` do Next.js, disparado uma única vez na inicialização do servidor.
3. **Persistência Global do Container (`globalThis`)**:
   - Em desenvolvimento (com HMR e Fast Refresh) e em Serverless (onde cada rota pode ser um bundle separado), armazena a instância raiz em `globalThis` para evitar que a árvore de módulos seja reconstruída a cada requisição.

---

### 3.2. Bootstrap da Aplicação (`src/main.ts`)

```typescript
import {NextDiFactory} from 'next-di';
import {AppModule} from './app.module';

export async function bootstrap() {
  const app = await NextDiFactory.createApplicationContext(AppModule);
  return app;
}
```

---

### 3.3. Módulo Raiz (`src/app.module.ts`)

```typescript
import {Module} from 'next-di';
import {AuthModule} from './module/auth/auth.module';
import {DashboardModule} from './module/dashboard/dashboard.module';

@Module({
  imports: [AuthModule, DashboardModule],
})
export class AppModule {}
```

---

### 3.4. Consumo em Server Actions (`apps/web/src/action/auth.action.ts`)

```typescript
'use server';

import {get} from 'next-di';
import {LoginWithOtpUseCase} from '#/application/usecase';
import type {AuthLoginBodyDto} from '@pkgs/shared-domain';
import {cookies} from 'next/headers';

export async function loginWithOtpAction(payload: AuthLoginBodyDto) {
  // Resolve toda a árvore de dependências a partir do módulo exportador
  const useCase = get(LoginWithOtpUseCase);
  const tokens = await useCase.execute(payload);

  const cookieStore = await cookies();
  cookieStore.set('accessToken', tokens.accessToken, {httpOnly: true});
  return {ok: true};
}
```

---

### 3.5. Consumo em Server Components (`apps/web/src/app/(shell)/me/page.tsx`)

```typescript
import { get } from 'next-di';
import { GetDashboardDataUseCase } from '#/application/usecase';
import { CustomerDashboardPage } from '#/presentation/page';

export default async function Page() {
  const data = await get(GetDashboardDataUseCase).execute();
  return <CustomerDashboardPage data={data} />;
}
```

---

## 4. Injeção de Instâncias em Componentes React (Padrões Modernos 100% Funcionais)

> **Decisão Arquitetural**: O `next-di` foca **100% no React Moderno Funcional (React 19 / Server Components / Hooks)**. Não há suporte a Class Components legados para eliminar por completo problemas de contexto de execução (`this`, `this.method.bind(this)`) e manter alinhamento com os padrões modernos da comunidade.

O `next-di` oferecerá **3 maneiras complementares e puramente funcionais de injeção**:

### 4.1. Abordagem 1: `inject(Token)` — Server Components, Server Actions & Funções

Inspirada no modelo moderno de funções standalone do Angular 14+, a função `inject()` resolve a dependência de forma síncrona diretamente no corpo da função durante o runtime do servidor:

```tsx
// Server Component (RSC)
import {inject} from 'next-di';
import {GetDashboardDataUseCase} from '#/application/usecase';
import {CustomerDashboardPage} from '#/presentation/page';

export default async function Page() {
  const dashboardUseCase = inject(GetDashboardDataUseCase);
  const data = await dashboardUseCase.execute();

  return <CustomerDashboardPage data={data} />;
}
```

- **Vantagens**:
  - Zero `this`, zero `bind`.
  - Zero cerimônia ou hooks em componentes de servidor.
  - Lê diretamente do container persistido no bootstrap (`main.ts`).

---

### 4.2. Abordagem 2: `useInject(Token)` — Client Components (`'use client'`)

Para componentes interativos que rodam no browser (gerenciando estado local, timers, eventos de UI), o hook `useInject()` obtém a dependência a partir do `<NextDiProvider>`:

```tsx
// apps/web/src/app/layout.tsx
import {NextDiProvider} from 'next-di/react';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <NextDiProvider>{children}</NextDiProvider>;
}
```

E no componente cliente:

```tsx
'use client';

import {useInject} from 'next-di/react';
import {InvoicePort} from '#/application/port';

export function QuickPaymentButton({invoiceId}: {invoiceId: string}) {
  const invoicePort = useInject(InvoicePort);

  const handlePay = async () => {
    await invoicePort.pay(invoiceId);
  };

  return <button onClick={handlePay}>Pagar Fatura</button>;
}
```

- **Vantagens**:
  - Padrão idiomático do React moderno (`Hook`).
  - Sem necessidade de classes ou boilerplate de ciclo de vida legado.

---

### 4.3. Abordagem 3: `withInject(dependencies)` — Higher-Order Component (Injeção via Props)

Para quem pratica **Atomic Design estrito** e deseja manter os componentes visuais **100% agnósticos de DI e livres de qualquer dependência direta de framework ou hooks**:

```tsx
import {withInject} from 'next-di/react';
import {GetDashboardDataUseCase} from '#/application/usecase';

interface CustomerDashboardPageProps {
  // As dependências são declaradas como Props normais da função
  dashboardUseCase: GetDashboardDataUseCase;
}

function CustomerDashboardPageComponent({dashboardUseCase}: CustomerDashboardPageProps) {
  // Componente funcional 100% puro!
  // Nos testes de Storybook ou Vitest, basta passar uma prop direta:
  // <CustomerDashboardPageComponent dashboardUseCase={mockUseCase} />
}

export const CustomerDashboardPage = withInject({
  dashboardUseCase: GetDashboardDataUseCase,
})(CustomerDashboardPageComponent);
```

- **Vantagens**:
  - Testabilidade máxima: nos testes unitários ou visuais, nenhuma lib de DI precisa estar ativa.
  - O componente continua sendo uma função JavaScript pura `(props) => JSX`.

---

## 5. Peças Técnicas a Construir na Lib `next-di`

A biblioteca deve ser leve e focar exclusivamente em IoC modular, sem acoplar bibliotecas pesadas de servidores HTTP (como Express ou Fastify do NestJS).

### Pacotes / Módulos Internos:

```
next-di/
├── src/
│   ├── core/
│   │   ├── container.ts              # Árvore de dependências e grafo de resolução
│   │   ├── module-ref.ts             # Referência e isolamento de escopo por módulo
│   │   ├── scanner.ts                # Scanner de metadados (@Module, @Injectable)
│   │   ├── tokens.ts                 # Resolução de tokens e Abstract Classes
│   │   └── factory.ts                # NextDiFactory.createApplicationContext
│   ├── decorator/
│   │   ├── module.decorator.ts       # @Module({ imports, providers, exports, controllers })
│   │   ├── injectable.decorator.ts   # @Injectable(options)
│   │   ├── inject.decorator.ts       # @Inject(token)
│   │   ├── injectable-as.decorator.ts# @InjectableAs(Port, options)
│   │   ├── optional.decorator.ts     # @Optional()
│   │   └── index.ts
│   ├── factory-class/
│   │   ├── auto-injectable-module.ts # Auto-registro por metadados de providers
│   │   ├── selectable-module.ts      # Módulos com selectionMap
│   │   └── configurable-module.ts    # Módulos com forRootAsync / useFactory
│   ├── react/                        # Suporte aos padrões funcionais modernos
│   │   ├── provider.tsx              # <NextDiProvider>
│   │   ├── use-inject.ts             # Hook useInject(Token)
│   │   ├── with-inject.tsx           # HOC withInject(deps)(Component)
│   │   └── index.ts
│   ├── next/
│   │   ├── with-next-di.ts           # Plugin para o next.config.js
│   │   ├── instrumentation-hook.ts   # Integração com o ciclo de vida do servidor
│   │   └── global-container.ts       # Persistência do container em globalThis
│   ├── api/
│   │   ├── inject.ts                 # Helper inject(Token) para Server Components e Actions
│   │   ├── get.ts                    # Helper global get(Token)
│   │   └── index.ts
│   └── index.ts
```

---

## 6. Cuidados Técnicos e Desafios de Compilação

1. **SWC / Turbopack Decorator Metadata**:
   - O `tsconfig.json` dos projetos consumidores precisa ter:
     ```json
     {
       "compilerOptions": {
         "experimentalDecorators": true,
         "emitDecoratorMetadata": true
       }
     }
     ```
   - O plugin `withNextDi` deve validar ou aplicar essas configurações automaticamente.
2. **Isolamento de Chunks do Next.js**:
   - Cada rota do Next.js pode ser empacotada em um chunk de execução isolado.
   - O `globalThis.__NEXT_DI_CONTAINER__` deve ser utilizado para armazenar o container singleton instanciado pelo `instrumentation.ts`, garantindo que qualquer Server Action ou rota tenha acesso imediato aos providers já inicializados.
3. **Suporte a Dependências Circulares**:
   - Implementar helper similar ao `forwardRef(() => Module)` do NestJS para resolver eventuais dependências circulares entre módulos ou serviços.

---

## 7. Referência no Monorepo Original

Para inspecionar como a lógica de `SelectableModule`, `AutoInjectableModule` e `@InjectableAs` já foi construída e testada:

- [`pkgs/nest-core/src/decorator/injectable-as.decorator.ts`](file:///c:/dev/github.com/leandroluk/metha/pkgs/nest-core/src/decorator/injectable-as.decorator.ts)
- [`pkgs/nest-core/src/factory-class/auto-injectable-module.factory-class.ts`](file:///c:/dev/github.com/leandroluk/metha/pkgs/nest-core/src/factory-class/auto-injectable-module.factory-class.ts)
- [`pkgs/nest-core/src/factory-class/selectable-module.factory-class.ts`](file:///c:/dev/github.com/leandroluk/metha/pkgs/nest-core/src/factory-class/selectable-module.factory-class.ts)
- [`pkgs/nest-core/src/factory-class/configurable-module.factory-class.ts`](file:///c:/dev/github.com/leandroluk/metha/pkgs/nest-core/src/factory-class/configurable-module.factory-class.ts)
- [`apps/api/src/app.module.ts`](file:///c:/dev/github.com/leandroluk/metha/apps/api/src/app.module.ts)
