import {describe, it, expect, beforeEach} from 'vitest';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {NextDiProvider, useInject, withInject} from '../../src/react';
import {clearGlobalContainer, setGlobalContainer} from '../../src/next/global-container';
import {NextDiFactory} from '../../src/core/factory';
import {Module} from '../../src/decorator/module.decorator';
import {Injectable} from '../../src/decorator/injectable.decorator';

describe('React 19 Functional Adapters', () => {
  beforeEach(() => {
    clearGlobalContainer();
  });

  abstract class CartPort {
    abstract getItemCount(): number;
  }

  @Injectable()
  class CartAdapter extends CartPort {
    getItemCount() {
      return 5;
    }
  }

  @Module({
    providers: [{provide: CartPort, useClass: CartAdapter}],
    exports: [CartPort],
  })
  class CartModule {}

  it('should resolve dependencies via useInject hook inside <NextDiProvider>', async () => {
    const app = await NextDiFactory.createApplicationContext(CartModule);

    function CartBadge() {
      const cart = useInject(CartPort);
      return <span>Items: {cart.getItemCount()}</span>;
    }

    const html = renderToString(
      <NextDiProvider context={app}>
        <CartBadge />
      </NextDiProvider>
    );

    expect(html).toContain('Items:');
    expect(html).toContain('5');
  });

  it('should resolve dependencies via withInject HOC without direct hook call in component', async () => {
    const app = await NextDiFactory.createApplicationContext(CartModule);
    setGlobalContainer(app);

    interface PureBadgeProps {
      title: string;
      cart: CartPort;
    }

    function PureBadge({title, cart}: PureBadgeProps) {
      return (
        <div>
          {title} - Count: {cart.getItemCount()}
        </div>
      );
    }

    const InjectedBadge = withInject({
      cart: CartPort,
    })(PureBadge);

    const html = renderToString(<InjectedBadge title="Checkout" />);
    expect(html).toContain('Checkout');
    expect(html).toContain('Count:');
    expect(html).toContain('5');
  });

  it('should throw clear error when no context or global container is available', () => {
    function BadComponent() {
      useInject(CartPort);
      return null;
    }

    expect(() => renderToString(<BadComponent />)).toThrowError(/No NextDiApplicationContext found/);
  });
});
