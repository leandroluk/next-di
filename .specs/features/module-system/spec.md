# Spec: Sistema de Módulos (NestJS-like Modular Architecture)

## Summary

Implementar o sistema de módulos declarativo do `next-di` inspirado na arquitetura do NestJS, trazendo isolamento de escopo (`imports`, `exports`, `providers`), módulos dinâmicos (`DynamicModule`), fábricas avançadas de módulos (`AutoInjectableModule`, `SelectableModule`, `ConfigurableModule`) e resolução via classes abstratas e decoradores. Esta solução é desacoplada de servidores HTTP pesados (Express/Fastify) e desenhada sob medida para o ciclo de vida do Next.js (Server Actions, React Server Components, Client Components e Serverless).

## Requirements

### REQ-001: Módulo Declarativo (`@Module`)

- O decorator `@Module(metadata)` deve aceitar `imports`, `providers`, `exports` e opcionalmente `controllers`.
- Metadados do módulo devem ser armazenados via reflexão (`reflect-metadata`) e lidos pelo scanner de inicialização.

### REQ-002: Isolamento de Escopo e Fronteira de Exportação

- Provedores registrados em `providers` são privados ao módulo por padrão.
- Um módulo consumidor que importa `ModuleA` só tem acesso aos provedores e módulos explicitamente declarados na lista `exports` de `ModuleA`.
- Módulos re-exportados (ex: `ModuleA` exportando `ModuleB`) devem disponibilizar as exportações de `ModuleB` para quem importar `ModuleA`.

### REQ-003: Tokens de Runtime via Classes Abstratas

- Classes abstratas de Clean Architecture (Ports) devem funcionar diretamente como tokens de injeção sem necessidade de strings ou símbolos (`inject(AuthPort)`).
- O compilador TypeScript deve gerar `design:paramtypes` apontando para a classe abstrata, permitindo injeção automática no construtor.

### REQ-004: Auto-Declaração de Implementação (`@InjectableAs`)

- O decorator `@InjectableAs(PortClass, options)` em um Adapter deve registrar metadados que associam o Adapter à Porta correspondente.
- Suporte a tokens individuais, múltiplos tokens (`multi: true`) e arrays de portas.
- Módulos (como `AutoInjectableModule`) devem converter automaticamente esses metadados em bindings `{ provide: PortClass, useExisting: AdapterClass }` e incluí-los nos `exports` do módulo.

### REQ-005: Tipos de Provedores Customizados

- O container deve suportar todos os formatos canônicos de provedores:
  - Provedor por classe: `ClassProvider` (`provide`, `useClass`) ou classe direta.
  - Provedor por valor: `ValueProvider` (`provide`, `useValue`).
  - Provedor por fábrica: `FactoryProvider` (`provide`, `useFactory`, `inject`).
  - Provedor por alias/existente: `ExistingProvider` (`provide`, `useExisting`).
  - Provedores múltiplos (`multi: true`): agregação de múltiplos provedores em um array de instâncias sob o mesmo token.

### REQ-006: Módulos Dinâmicos (`DynamicModule`)

- Métodos estáticos de módulos (ex: `forRoot`, `forRootAsync`) podem retornar um objeto `DynamicModule` contendo `module`, `imports`, `providers`, `exports` e flag `global`.
- Módulos marcados com `global: true` disponibilizam seus `exports` para todos os módulos da árvore sem necessidade de re-importação manual.

### REQ-007: Fábricas Avançadas de Módulos

- `AutoInjectableModule`: classe geradora que inspeciona a lista de providers, localiza `@InjectableAs`, cria os bindings automáticos e exporta as portas.
- `SelectableModule`: classe geradora que recebe um `selectionMap` e provê o método `forRootAsync({ provider: 'name', useFactory, inject })`, validando a escolha e resolvendo o módulo correspondente.
- `ConfigurableModule`: classe geradora baseada em classe de configuração tipada, disponibilizando `forRootAsync` tipado com injeção de fábrica.

### REQ-008: Resolução de Dependências Circulares (`forwardRef`)

- Fornecer utilitário `forwardRef(() => Target)` para permitir imports circulares entre módulos ou injeções circulares entre serviços sem travar o runtime.

### REQ-009: Bootstrap e Ciclo de Vida da Aplicação

- `NextDiFactory.createApplicationContext(RootModule)` compila o grafo de módulos, instancia singletons e retorna o `NextDiApplicationContext`.
- O contexto é salvo em `globalThis.__NEXT_DI_CONTAINER__` para resistir ao isolamento de chunks em Serverless e recargas de desenvolvimento (HMR).

### REQ-010: Consumo Funcional em Next.js & React

- `inject(Token)` e `get(Token)`: resolução síncrona direta em Server Components e Server Actions.
- `<NextDiProvider>` e hook `useInject(Token)`: resolução no Client Component (`'use client'`).
- `withInject(deps)(Component)`: HOC para injeção via props pura (Atomic Design).

## Affected Components

- `src/core/container.ts` — Árvore de dependências e grafo de resolução IoC.
- `src/core/module-ref.ts` — Escopo isolado e tabela de símbolos por módulo.
- `src/core/scanner.ts` — Varredura de módulos e metadados.
- `src/core/tokens.ts` — Definições de tokens e tipos de injeção.
- `src/core/factory.ts` — NextDiFactory e ApplicationContext.
- `src/decorator/*` — `@Module`, `@Injectable`, `@InjectableAs`, `@Inject`, `@Optional`.
- `src/factory-class/*` — `AutoInjectableModule`, `SelectableModule`, `ConfigurableModule`.
- `src/api/*` — `get()`, `inject()`.
- `src/react/*` — `<NextDiProvider>`, `useInject()`, `withInject()`.
- `src/next/*` — `withNextDi`, `global-container.ts`.

## Out of Scope

- Servidor HTTP próprio ou integração com Express/Fastify (o Next.js já é o servidor).
- Controllers HTTP do NestJS (Next.js usa Server Actions e Route Handlers nativos).
- Microservices, WebSockets ou CQRS embutidos nesta primeira versão.

## Open Questions

- Suporte a scoped providers (Request Scoped vs Singleton): O padrão será `Singleton` como o padrão do NestJS, com escopos adicionais planejados para o futuro se necessário.
