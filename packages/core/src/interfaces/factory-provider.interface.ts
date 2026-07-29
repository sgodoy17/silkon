import { BaseProviderInterface } from './base-provider.interface';

export interface FactoryProviderInterface extends BaseProviderInterface {
  useFactory: (...args: any[]) => unknown;
  deps?: string[];
}
