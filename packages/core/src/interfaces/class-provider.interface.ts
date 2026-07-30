import { BaseProviderInterface } from './base-provider.interface';

export interface ClassProviderInterface<
  TArgs extends unknown[] = unknown[],
> extends BaseProviderInterface {
  useClass: new (...args: TArgs) => unknown;
  deps?: string[];
}
