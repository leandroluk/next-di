# Architecture Overview

`next-di` provê uma infraestrutura de Inversão de Controle (IoC) inspirada na robustez do NestJS, mas adaptada especificamente para o modelo do Next.js moderno (Server Actions, Server Components, Route Handlers, SSR/SSG e Turbopack/SWC).

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App                           │
│  (Server Actions / Server Components / Client Components)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ get(Token) / inject(Token)    │ useInject() / withInject()
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NextDi Application                       │
│        (Persistida globalmente em globalThis)               │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│        Root Module           │ │       Dynamic Modules        │
│       (AppModule)            │ │(Selectable/Configurable)     │
└──────────────┬───────────────┘ └─────────────┬────────────────┘
               │ imports                       │ exports
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ModuleRef Graph                        │
│          (Isolamento de visibilidade por módulo)             │
├─────────────────────────────────────────────────────────────┤
│  - Providers privados                                       │
│  - Providers exportados (visíveis para módulos pais/filhos) │
│  - Mapeamento automático de Portas via @InjectableAs        │
└─────────────────────────────────────────────────────────────┘
```

## Key Subsystems

1. **Metadata & Decorator Engine**: Utiliza `reflect-metadata` para capturar tipos de construtor (`design:paramtypes`) e metadados customizados (`@Module`, `@InjectableAs`, `@Optional`).
2. **Modular Graph Container**: Constrói um grafo acíclico direcionado (com suporte a `forwardRef` para ciclos) contendo `ModuleRef`s. Cada `ModuleRef` gerencia sua própria tabela de símbolos e instâncias singleton.
3. **Module Factories**: Permite a criação de módulos estáticos ou dinâmicos (`DynamicModule`) de forma tipada e reativa, como módulos com chaveamento dinâmico de drivers (`SelectableModule`) ou inicialização assíncrona (`ConfigurableModule`).
4. **Next.js & React Adapters**:
   - `withNextDi`: Habilita decorators e conecta ao lifecycle do servidor via `instrumentation.ts`.
   - `globalThis.__NEXT_DI_CONTAINER__`: Resiliência a Serverless lambda chunking e HMR.
   - Padrões de injeção funcionais modernos (`inject`, `useInject`, `withInject`).
