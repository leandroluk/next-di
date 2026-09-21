import type {InjectionToken, Type} from './tokens';
import {NextDiContainer} from './container';
import {ModuleScanner, type ModuleInput} from './scanner';
import type {ModuleRef} from './module-ref';

export class NextDiApplicationContext {
  constructor(public readonly container: NextDiContainer) {}

  /**
   * Resolves a dependency from the application context synchronously.
   */
  public get<T = any>(token: InjectionToken<T>): T {
    return this.container.get(token);
  }

  /**
   * Resolves a dependency from the application context asynchronously.
   */
  public async resolve<T = any>(token: InjectionToken<T>): Promise<T> {
    return this.get(token);
  }

  /**
   * Selects a specific ModuleRef from the application context.
   */
  public select<T = any>(moduleType: Type<T>): ModuleRef {
    const moduleRef = this.container.getModule(moduleType);
    if (!moduleRef) {
      throw new Error(`[NextDi] Module '${moduleType.name}' was not found in the application context.`);
    }
    return moduleRef;
  }

  /**
   * Closes the application context and clears singletons.
   */
  public async close(): Promise<void> {
    // Lifecycle hook for cleanup
  }

  /**
   * Initializes all singletons eagerly if needed.
   */
  public async init(): Promise<this> {
    return this;
  }
}

export class NextDiFactory {
  /**
   * Bootstraps the application context starting from the root module.
   */
  public static async createApplicationContext(rootModule: ModuleInput): Promise<NextDiApplicationContext> {
    const container = new NextDiContainer();
    const scanner = new ModuleScanner(container);
    await scanner.scan(rootModule);

    const appContext = new NextDiApplicationContext(container);
    await appContext.init();
    return appContext;
  }
}
