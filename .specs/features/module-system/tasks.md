# Tasks: Sistema de Módulos (NestJS-like Modular Architecture)

## T-001: Setup do Projeto & Dependências Base [x]

- **REQ**: REQ-001
- **What**: Configurar `package.json`, `tsconfig.json` (com `experimentalDecorators` e `emitDecoratorMetadata`), `tsdown.config.ts`, `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`, `lefthook.yaml` e instalar `reflect-metadata`.
- **Where**: `package.json`, `tsconfig.json`, `vitest.config.ts`, `tsdown.config.ts`
- **Depends on**: none
- **Done when**: Ambiente compila TypeScript e Vitest executa testes com decorators.
- **Gate**: `pnpm test`

## T-002: Decorators de Metadados Core [x]

- **REQ**: REQ-001, REQ-003, REQ-004
- **What**: Implementar `@Module()`, `@Injectable()`, `@Inject()`, `@Optional()`, `@InjectableAs()` e utilitário `forwardRef()`.
- **Where**: `src/decorator/*`, `src/core/forward-ref.ts`, `src/core/tokens.ts`
- **Depends on**: T-001
- **[P]**: false
- **Done when**: Testes unitários validam o armazenamento e leitura correta de metadados via `Reflect`.
- **Gate**: `pnpm vitest run tests/decorator`

## T-003: Core Container & Scanner de Módulos [x]

- **REQ**: REQ-001, REQ-002, REQ-005, REQ-008
- **What**: Implementar `ModuleScanner`, `ModuleRef`, `NextDiContainer` e o algoritmo de isolamento de escopo (verificação local -> imports exports -> global -> falha) com suporte a `forwardRef`.
- **Where**: `src/core/container.ts`, `src/core/module-ref.ts`, `src/core/scanner.ts`
- **Depends on**: T-002
- **Done when**: Testes garantem que provedores privados não vazam entre módulos e provedores exportados são resolvidos corretamente.
- **Gate**: `pnpm vitest run tests/core/container.spec.ts`

## T-004: Dynamic Modules & NextDiFactory [x]

- **REQ**: REQ-006, REQ-009
- **What**: Implementar suporte a `DynamicModule`, `forRoot`, `forRootAsync` e classe `NextDiFactory.createApplicationContext()`.
- **Where**: `src/core/factory.ts`, `src/core/container.ts`
- **Depends on**: T-003
- **Done when**: Módulos dinâmicos síncronos e assíncronos são registrados e instanciados pelo contexto da aplicação.
- **Gate**: `pnpm vitest run tests/core/factory.spec.ts`

## T-005: Advanced Module Factories (`AutoInjectable`, `Selectable`, `Configurable`) [x]

- **REQ**: REQ-004, REQ-007
- **What**: Portar e adaptar `AutoInjectableModule`, `SelectableModule` e `ConfigurableModule` baseados nas abstrações consolidadas do `pkgs/nest-core`.
- **Where**: `src/factory-class/*`
- **Depends on**: T-004
- **Done when**: Testes cobrindo auto-export de `@InjectableAs`, chaveamento de provedores via `selectionMap` e configuração assíncrona com `forRootAsync`.
- **Gate**: `pnpm vitest run tests/factory-class`

## T-006: Persistência Global & API Helpers (`inject`, `get`) [x]

- **REQ**: REQ-009, REQ-010
- **What**: Implementar `globalThis.__NEXT_DI_CONTAINER__` e funções `inject(Token)` e `get(Token)`.
- **Where**: `src/api/*`, `src/next/global-container.ts`
- **Depends on**: T-004
- **[P]**: true (independente das factory-classes)
- **Done when**: `inject(Token)` e `get(Token)` resolvem instâncias a partir do singleton global com tratamento de erros descritivos.
- **Gate**: `pnpm vitest run tests/api`

## T-007: Adaptadores React 19 Funcionais [x]

- **REQ**: REQ-010
- **What**: Implementar `<NextDiProvider>`, hook `useInject(Token)` e HOC `withInject(deps)(Component)`.
- **Where**: `src/react/*`
- **Depends on**: T-006
- **Done when**: Componentes funcionais React conseguem consumir instâncias via hook e via props injetadas sem erros de ciclo de vida.
- **Gate**: `pnpm vitest run tests/react`

## T-008: Plugin Next.js (`withNextDi`) & Hooks de Inicialização [x]

- **REQ**: REQ-009, REQ-010
- **What**: Implementar plugin `withNextDi(options)(nextConfig)` que ajusta flags do compilador SWC/Turbopack e hook para `instrumentation.ts`.
- **Where**: `src/next/with-next-di.ts`, `src/next/instrumentation-hook.ts`
- **Depends on**: T-006
- **Done when**: `withNextDi` injeta corretamente as opções de compilação sem quebrar configurações existentes do usuário.
- **Gate**: `pnpm vitest run tests/next`
