import { BaseProviderInterface } from './base-provider.interface';

export interface ClassProviderInterface extends BaseProviderInterface {
  useClass: new (...args: any[]) => unknown;
  deps?: string[];
}
