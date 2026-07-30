import { GeneralException, Lifetime } from '@silkon/common';

import { Container, type Provider } from '../../../src';

describe('Container', () => {
  it('resolves value providers', () => {
    const container = new Container();

    container.register('config', {
      useValue: { name: 'silkon' },
    });

    expect(container.resolve<{ name: string }>('config')).toEqual({
      name: 'silkon',
    });
  });

  it('resolves class providers with singleton lifetime', () => {
    class Dependency {
      public readonly id = Symbol('dependency');
    }

    class Service {
      constructor(public readonly dependency: Dependency) {}
    }

    const container = new Container();

    const dependencyProvider = {
      lifetime: Lifetime.SINGLETON,
      useClass: Dependency,
    } as Provider;

    const serviceProvider = {
      lifetime: Lifetime.SINGLETON,
      useClass: Service,
      deps: ['dependency'],
    } as Provider;

    container.register('dependency', dependencyProvider);
    container.register('service', serviceProvider);

    const first = container.resolve<Service>('service');
    const second = container.resolve<Service>('service');

    expect(first).toBeInstanceOf(Service);
    expect(first).toBe(second);
    expect(first.dependency).toBeInstanceOf(Dependency);
    expect(first.dependency).toBe(second.dependency);
  });

  it('resolves factory providers with dependencies', () => {
    const container = new Container();

    container.register('prefix', {
      useValue: 'core',
    });

    container.register('factory', {
      useFactory: (prefix: string) => `${prefix}-provider`,
      deps: ['prefix'],
    } as Provider);

    expect(container.resolve<string>('factory')).toBe('core-provider');
  });

  it('throws when a provider is missing', () => {
    const container = new Container();

    expect(() => container.resolve('missing')).toThrow(GeneralException);
    expect(() => container.resolve('missing')).toThrow('No provider found for token "missing"');
  });

  it('throws when a dependency is not registered', () => {
    const container = new Container();

    container.register('service', {
      useFactory: (dependency: unknown) => dependency,
      deps: ['dependency'],
    });

    expect(() => container.resolve('service')).toThrow(
      'Dependency "dependency" not registered (required by "service").',
    );
  });

  it('throws when a singleton depends on a transient provider', () => {
    const container = new Container();

    container.register('dependency', {
      lifetime: Lifetime.TRANSIENT,
      useValue: 'transient',
    });

    container.register('service', {
      lifetime: Lifetime.SINGLETON,
      useFactory: (dependency: string) => dependency,
      deps: ['dependency'],
    } as Provider);

    expect(() => container.resolve('service')).toThrow(
      'Invalid DI: singleton "service" cannot depend on transient "dependency".',
    );
  });
});
