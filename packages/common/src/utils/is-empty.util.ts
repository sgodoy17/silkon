import { isArray } from './is-array.util';

export const isEmpty = (input: unknown): input is boolean =>
  !(input && isArray(input) && input.length > 0);
