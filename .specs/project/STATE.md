# Project State — next-di

## Current Work

- Implementação completa do sistema de módulos NestJS-like concluída com sucesso. Todas as tarefas T-001 a T-008 finalizadas e verificadas com 25 testes unitários e build de produção tsdown.

## Recent Progress (Last 10)

- 2026-09-20 T-008 complete. Gate: 2/2 pass. [REQ-009, REQ-010]
- 2026-09-20 T-007 complete. Gate: 3/3 pass. [REQ-010]
- 2026-09-20 T-006 complete. Gate: 2/2 pass. [REQ-009, REQ-010]
- 2026-09-20 T-005 complete. Gate: 4/4 pass. [REQ-004, REQ-007]
- 2026-09-20 T-004 complete. Gate: 2/2 pass. [REQ-006, REQ-009]
- 2026-09-20 T-003 complete. Gate: 6/6 pass. [REQ-001, REQ-002, REQ-005, REQ-008]
- 2026-09-20 T-002 complete. Gate: 5/5 pass. [REQ-001, REQ-003, REQ-004]
- 2026-09-20 T-001 complete. Setup tsdown, oxlint, oxfmt, lefthook e vitest. Gate: 1/1 pass. [REQ-001]
- 2026-09-20 [module-system] Especificação, Design e Tasks criados no .specs/.

## Recent Decisions (Last 15)

- 2026-09-20 Adoção do `tsdown` (rolldown/oxc) como bundler moderno no lugar de `tsup`.
- 2026-09-20 Adoção de `oxfmt` para formatação, `oxlint` para linting ultrarrápido e `lefthook` para Git hooks com commitlint.
- 2026-09-20 Uso de `unplugin-swc` no Vitest para emissão fidedigna de `design:paramtypes` em ambiente de testes.
- 2026-09-20 Arquitetura modular inspirada no NestJS (`@Module`, `imports`, `providers`, `exports`, `DynamicModule`) desacoplada de runtime HTTP.
- 2026-09-20 Uso estrito de classes abstratas como tokens de injeção em tempo de execução para aproveitar `design:paramtypes`.
- 2026-09-20 Implementação de fábricas de módulos avançados (`AutoInjectableModule`, `SelectableModule`, `ConfigurableModule`) portadas do ecossistema `metha/pkgs/nest-core`.
- 2026-09-20 Isolamento de escopo por módulo (regras estritas de visibilidade: um módulo consumidor só enxerga providers explicitamente listados nos `exports` do módulo importado).
- 2026-09-20 Suporte a React 19 funcional moderno sem suporte a classes legadas: `inject()` síncrono para RSC/Server Actions, `useInject()` para Client Components e `withInject()` para Atomic Design.

## Lessons Learned (Last 5)

- Vite / Vitest necessita de `unplugin-swc` para emitir `design:paramtypes` para classes decoradas com decorators TypeScript.
- `renderToString` no React 19 insere nós de comentário (`<!-- -->`) entre interpolações de strings.

## Active Blockers

- none

## Todos

- [x] T-001: Setup do Projeto & Dependências Base
- [x] T-002: Decorators de Metadados Core
- [x] T-003: Core Container & Scanner de Módulos
- [x] T-004: Dynamic Modules & NextDiFactory
- [x] T-005: Advanced Module Factories (AutoInjectable, Selectable, Configurable)
- [x] T-006: Persistência Global & API Helpers (inject, get)
- [x] T-007: Adaptadores React 19 Funcionais
- [x] T-008: Plugin Next.js (withNextDi) & Hooks de Inicialização
