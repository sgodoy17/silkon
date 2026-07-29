import { BaseProviderInterface } from './base-provider.interface';

export interface FactoryProviderInterface<
  TArgs extends unknown[] = unknown[],
> extends BaseProviderInterface {
  useFactory: (...args: TArgs) => unknown;
  deps?: string[];
}
