export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export type AbstractType<T = any> = abstract new (...args: any[]) => T;

export type InjectionToken<T = any> = Type<T> | AbstractType<T> | string | symbol | Function;

export interface OptionalFactoryDependency {
  token: InjectionToken;
  optional?: boolean;
}

export interface ClassProvider<T = any> {
  provide: InjectionToken<T>;
  useClass: Type<T>;
  multi?: boolean;
}

export interface ValueProvider<T = any> {
  provide: InjectionToken<T>;
  useValue: T;
  multi?: boolean;
}

export interface FactoryProvider<T = any> {
  provide: InjectionToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  multi?: boolean;
}

export interface ExistingProvider<T = any> {
  provide: InjectionToken<T>;
  useExisting: InjectionToken<T>;
  multi?: boolean;
}

export type CustomProvider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>;

export type Provider<T = any> = Type<T> | CustomProvider<T>;

export interface DynamicModule {
  module: Type<any>;
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers?: Provider[];
  exports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference | InjectionToken>;
  controllers?: Type<any>[];
  global?: boolean;
}

export interface ForwardReference<T = any> {
  forwardRef: () => T;
}

export const MODULE_METADATA = {
  IMPORTS: 'next-di:module:imports',
  PROVIDERS: 'next-di:module:providers',
  EXPORTS: 'next-di:module:exports',
  CONTROLLERS: 'next-di:module:controllers',
  GLOBAL: 'next-di:module:global',
} as const;

export const INJECTABLE_WATERMARK = 'next-di:injectable';
export const INJECT_METADATA = 'next-di:inject';
export const OPTIONAL_METADATA = 'next-di:optional';
export const PARAMTYPES_METADATA = 'design:paramtypes';
