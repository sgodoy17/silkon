import { GeneralException, Lifetime } from '@silkon/common';

import { Provider } from '../types';

export class Container {
  private readonly registry = new Map<string, Provider>();
  private readonly singletons = new Map<string, unknown>();

  public register(token: string, provider: Provider): void {
    this.registry.set(token, provider);
  }

  public resolve<T>(token: string): T {
    const provider = this.registry.get(token);

    if (!provider) {
      throw new GeneralException(`No provider found for token "${token}"`);
    }

    if (provider.lifetime === Lifetime.SINGLETON) {
      if (this.singletons.has(token)) {
        return this.singletons.get(token) as T;
      }

      const instance: T = this.build(token, provider);

      this.singletons.set(token, instance);

      return instance;
    }

    return this.build(token, provider);
  }

  private build<T>(token: string, provider: Provider): T {
    const deps = this.hasDeps(provider)
      ? provider.deps?.map(depToken => {
          const depProvider = this.registry.get(depToken);

          if (!depProvider) {
            throw new GeneralException(
              `Dependency "${depToken}" not registered (required by "${token}").`,
            );
          }

          if (
            provider.lifetime === Lifetime.SINGLETON &&
            depProvider.lifetime === Lifetime.TRANSIENT
          ) {
            throw new GeneralException(
              `Invalid DI: singleton "${token}" cannot depend on transient "${depToken}".`,
            );
          }

          return this.resolve(depToken);
        })
      : [];

    if ('useValue' in provider) {
      return provider.useValue as T;
    }

    if ('useClass' in provider) {
      return new provider.useClass(...deps) as T;
    }

    if ('useFactory' in provider) {
      return provider.useFactory(...deps) as T;
    }

    throw new GeneralException(`Invalid provider configuration for "${token}"`);
  }

  private hasDeps(provider: Provider): provider is Extract<Provider, { deps?: string[] }> {
    return 'deps' in provider;
  }
}
