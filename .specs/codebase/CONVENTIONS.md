# Codebase Conventions

## Coding Standards

1. **Clean Architecture & Ports**:
   - Portas são definidas estritamente como `abstract class` (para persistirem como símbolos em runtime sem strings mágicas).
   - Adapters usam `@InjectableAs(PortClass)` e `@Injectable()`.
2. **Modularidade**:
   - Módulos são declarados com `@Module({ imports, providers, exports, controllers })`.
   - Isolamento de escopo estrito: o que não estiver em `exports` é estritamente privado ao módulo.
3. **Padrões Funcionais no React**:
   - 100% livre de classes em componentes React (zero `this`, zero `bind`).
   - Server Components e Server Actions utilizam `inject(Token)` ou `get(Token)`.
   - Client Components utilizam o hook `useInject(Token)`.
   - Componentes visuais desacoplados utilizam o HOC `withInject(deps)(Component)`.
4. **Nomenclatura**:
   - Decorators: `kebab-case.decorator.ts`
   - Fábricas de Módulos: `kebab-case.ts` ou `kebab-case.factory-class.ts`
   - Testes: `*.spec.ts` ou `*.test.ts`
   - Imports relativos claros ou path aliases organizados.
