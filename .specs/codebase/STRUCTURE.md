# Repository & Package Structure

```
next-di/
├── src/
│   ├── core/
│   │   ├── container.ts              # Árvore de dependências e grafo de resolução IoC
│   │   ├── module-ref.ts             # Instância e escopo isolado do módulo
│   │   ├── scanner.ts                # Scanner de metadados de módulos e dependências
│   │   ├── tokens.ts                 # Tipos e utilitários de InjectionToken
│   │   └── factory.ts                # NextDiFactory.createApplicationContext
│   ├── decorator/
│   │   ├── module.decorator.ts       # @Module({ imports, providers, exports, controllers })
│   │   ├── injectable.decorator.ts   # @Injectable(options)
│   │   ├── inject.decorator.ts       # @Inject(token)
│   │   ├── injectable-as.decorator.ts# @InjectableAs(Port, options)
│   │   ├── optional.decorator.ts     # @Optional()
│   │   └── index.ts
│   ├── factory-class/
│   │   ├── auto-injectable-module.ts # Auto-registro de portas a partir de @InjectableAs
│   │   ├── selectable-module.ts      # Módulo dinâmico com selectionMap
│   │   ├── configurable-module.ts    # Módulo dinâmico forRootAsync
│   │   └── index.ts
│   ├── react/                        # Adaptadores funcionais para React 18/19
│   │   ├── provider.tsx              # <NextDiProvider>
│   │   ├── use-inject.ts             # Hook useInject(Token)
│   │   ├── with-inject.tsx           # HOC withInject(deps)(Component)
│   │   └── index.ts
│   ├── next/                         # Integração com Next.js
│   │   ├── with-next-di.ts           # Plugin de configuração para next.config.ts
│   │   ├── instrumentation-hook.ts   # Bootstrap do servidor via register()
│   │   ├── global-container.ts       # Armazenamento resiliente em globalThis
│   │   └── index.ts
│   ├── api/
│   │   ├── inject.ts                 # inject(Token) funcional
│   │   ├── get.ts                    # get(Token) global
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── core/
│   ├── decorator/
│   ├── factory-class/
│   ├── react/
│   └── next/
└── package.json
```
