import { BaseProviderInterface } from './base-provider.interface';

export interface ValueProviderInterface extends BaseProviderInterface {
  useValue: unknown;
}
