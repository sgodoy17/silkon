import { isNil } from './is-nil.util';

export const isObject = (input: unknown): boolean => !isNil(input) && typeof input === 'object';
