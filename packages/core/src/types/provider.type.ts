import {
  ClassProviderInterface,
  FactoryProviderInterface,
  ValueProviderInterface,
} from '../interfaces';

export type Provider = ClassProviderInterface | FactoryProviderInterface | ValueProviderInterface;
