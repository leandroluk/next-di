import {describe, it, expect} from 'vitest';

describe('Setup Smoke Test', () => {
  it('should support decorators and reflect-metadata', () => {
    function TestDec(name: string): ClassDecorator {
      return (target: object) => {
        Reflect.defineMetadata('test:name', name, target);
      };
    }

    @TestDec('NextDi')
    class SampleClass {}

    expect(Reflect.getMetadata('test:name', SampleClass)).toBe('NextDi');
  });
});
