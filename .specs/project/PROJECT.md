# Project: next-di

## Overview

`next-di` é uma biblioteca de Injeção de Dependências (IoC) modular e declarativa projetada especificamente para Next.js (App Router, Server Actions, React Server Components e Client Components).

Inspirada no sistema de módulos do NestJS (`@Module`, `imports`, `providers`, `exports`, `DynamicModule`), a biblioteca elimina a necessidade de fábricas manuais (`make*UseCase`) ou configuração imperativa manual (como TSyringe/Inversify), respeitando o ciclo de vida do Next.js (Turbopack, SWC, RSC e Serverless chunking).

## Core Principles

1. **Módulos Declarativos de Primeira Classe**: Isolamento de escopo por módulo via `imports` e `exports`, permitindo arquitetura limpa e desacoplada.
2. **Tokens de Runtime via Classes Abstratas**: Eliminação de strings e símbolos mágicos. Classes abstratas geram tokens de runtime nativos com `design:paramtypes`.
3. **Auto-Declaração de Implementação (`@InjectableAs`)**: Adapters declaram quais portas implementam, permitindo resolução e exportação automática sem boilerplate.
4. **Módulos Dinâmicos e Selecionáveis**: Suporte nativo a `DynamicModule`, `SelectableModule` (chaveamento por mapa) e `ConfigurableModule` (`forRootAsync` assíncrono).
5. **Next.js & React 19 First-Class**:
   - `withNextDi` para integração via Turbopack/SWC e `instrumentation.ts`.
   - Persistência em `globalThis` para sobreviver ao isolamento de chunks em Serverless e HMR.
   - Padrões 100% funcionais no React: `inject()` síncrono para RSC/Server Actions, hook `useInject()` para Client Components e HOC `withInject()` para Atomic Design puro.
