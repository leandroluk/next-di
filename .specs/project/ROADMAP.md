# Roadmap: next-di

## Milestone 1: Core Modular IoC Container

- [ ] Engine de Metadados (`reflect-metadata`, decorators `@Module`, `@Injectable`, `@Inject`, `@InjectableAs`, `@Optional`)
- [ ] Container IoC & Grafo de Módulos (Resolução com isolamento de visibilidade por `exports` e `imports`)
- [ ] Resolução de Dependências Circulares (`forwardRef`)
- [ ] Módulos Dinâmicos (`DynamicModule`, `forRoot`, `forRootAsync`)
- [ ] Suporte a Tokens de Runtime via Classes Abstratas

## Milestone 2: Advanced Module Factories

- [ ] `AutoInjectableModule` (Auto-descoberta de `@InjectableAs` em providers e auto-exportação de portas)
- [ ] `SelectableModule` (Chaveamento dinâmico de provedores via mapa de seleção)
- [ ] `ConfigurableModule` (Módulos assíncronos configuráveis com `forRootAsync` e `useFactory`)

## Milestone 3: Next.js Runtime Integration

- [ ] Singleton de Container em `globalThis` para Serverless chunks e Turbopack HMR
- [ ] Hook de ciclo de vida do servidor (`instrumentation.ts` integration)
- [ ] Configuração do compilador Next.js (`withNextDi` para SWC/Turbopack decorator metadata)
- [ ] Helpers globais de resolução (`get()`, `inject()`)

## Milestone 4: React 19 Integration

- [ ] `<NextDiProvider>` para Client Components
- [ ] Hook `useInject(Token)`
- [ ] HOC `withInject(deps)(Component)` para Atomic Design
