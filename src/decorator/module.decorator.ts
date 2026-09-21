import {
  MODULE_METADATA,
  type Provider,
  type Type,
  type DynamicModule,
  type ForwardReference,
  type InjectionToken,
} from '../core/tokens';

export interface ModuleMetadata {
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  providers?: Provider[];
  exports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference | InjectionToken>;
  controllers?: Type<any>[];
}

/**
 * Decorator that marks a class as a NextDi module and provides metadata.
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object) => {
    for (const property in metadata) {
      if (Object.prototype.hasOwnProperty.call(metadata, property)) {
        const metadataKey = (MODULE_METADATA as any)[property.toUpperCase()];
        if (metadataKey) {
          Reflect.defineMetadata(metadataKey, (metadata as any)[property], target);
        }
      }
    }
  };
}
