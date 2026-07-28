import { isNil } from './is-nil.util';

export const isObject = (input: unknown): input is object =>
  !isNil(input) && typeof input === 'object';
