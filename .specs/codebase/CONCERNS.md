# Architectural Concerns & Risks

## 1. Next.js Bundling & Tree Shaking (SWC / Turbopack)

- **Risco**: Bundlers como Turbopack e SWC podem ignorar ou remover classes que parecem "não utilizadas" se forem registradas apenas via decorators ou metadados de reflexão.
- **Mitigação**: O plugin `withNextDi` deve configurar opções de compilação apropriadas (`experimentalDecorators`, `emitDecoratorMetadata`) e garantir que módulos importados sejam avaliados.

## 2. Serverless Execution & Chunk Isolation

- **Risco**: Em plataformas como Vercel/AWS Lambda, cada Server Action ou Route Handler pode ser compilada em um chunk isolado. Se o container for recriado a cada invocação, perde-se performance e estado de singletons.
- **Mitigação**: Persistência no runtime através de `globalThis.__NEXT_DI_CONTAINER__` e inicialização única via `instrumentation.ts register()`.

## 3. Dependências Circulares

- **Risco**: Módulos que importam um ao outro diretamente causam `ReferenceError` ou instâncias `undefined` durante o carregamento de módulos ES / CommonJS.
- **Mitigação**: Suporte explícito ao padrão `forwardRef(() => Target)` tanto para módulos quanto para providers.

## 4. Isolamento de Escopo Estrito

- **Risco**: Vazamento de provedores privados entre módulos. No NestJS, se `ModuleA` provê `ServiceX` sem exportar, `ModuleB` não deve conseguir resolver `ServiceX`.
- **Mitigação**: A árvore de resolução de dependências deve respeitar estritamente a fronteira do `ModuleRef` consumidor e a lista de `exports` do módulo fornecedor.
