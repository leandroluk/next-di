import {describe, it, expect} from 'vitest';
import {Module, Injectable, InjectableAs, Inject, Optional} from '../../src/decorator';
import {MODULE_METADATA, INJECTABLE_WATERMARK, forwardRef, isForwardRef} from '../../src/core';

describe('Core Decorators', () => {
  it('should define module metadata with @Module', () => {
    class ServiceA {}
    class ModuleB {}

    @Module({
      imports: [ModuleB],
      providers: [ServiceA],
      exports: [ServiceA],
    })
    class ModuleA {}

    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, ModuleA)).toEqual([ModuleB]);
    expect(Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ModuleA)).toEqual([ServiceA]);
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, ModuleA)).toEqual([ServiceA]);
  });

  it('should mark class with @Injectable', () => {
    @Injectable()
    class TestService {}

    expect(Reflect.getMetadata(INJECTABLE_WATERMARK, TestService)).toBe(true);
  });

  it('should support @InjectableAs with single, array and multi tokens', () => {
    abstract class PortA {}
    abstract class PortB {}
    abstract class PluginPort {}

    @InjectableAs(PortA)
    class AdapterA implements PortA {}

    @InjectableAs([PortA, PortB])
    class AdapterAB implements PortA, PortB {}

    @InjectableAs(PluginPort, {multi: true})
    class PluginOne implements PluginPort {}

    const metaA = InjectableAs.getMetadata(AdapterA);
    expect(metaA?.tokens).toEqual([PortA]);
    expect(metaA?.multiTokens).toEqual([]);

    const metaAB = InjectableAs.getMetadata(AdapterAB);
    expect(metaAB?.tokens).toEqual([PortA, PortB]);
    expect(metaAB?.multiTokens).toEqual([]);

    const metaPlugin = InjectableAs.getMetadata(PluginOne);
    expect(metaPlugin?.tokens).toEqual([]);
    expect(metaPlugin?.multiTokens).toEqual([PluginPort]);
  });

  it('should record @Inject and @Optional parameter metadata', () => {
    abstract class LoggerPort {}

    @Injectable()
    class ConsumerService {
      constructor(
        @Inject(LoggerPort) public logger: LoggerPort,
        @Optional() public extraConfig?: string
      ) {}
    }

    const injectMeta = Inject.getMetadata(ConsumerService);
    expect(injectMeta).toEqual([{index: 0, token: LoggerPort}]);

    const optionalMeta = Optional.getMetadata(ConsumerService);
    expect(optionalMeta).toEqual([1]);
  });

  it('should create and verify forwardRef', () => {
    class TargetClass {}
    const ref = forwardRef(() => TargetClass);

    expect(isForwardRef(ref)).toBe(true);
    expect(ref.forwardRef()).toBe(TargetClass);
    expect(isForwardRef({})).toBe(false);
  });
});
