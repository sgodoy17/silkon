import { isUndefined } from './is-undefined.util';

export const isNil = (input: unknown): input is null | undefined =>
  isUndefined(input) || input === null;
