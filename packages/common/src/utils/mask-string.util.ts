import { Mask } from '../types';
import { maskValue } from './mask-value.util';

export const maskString = (message: string, fields?: Record<string, Mask>): string => {
  let result = message;

  for (const [field, config] of Object.entries(fields ?? {})) {
    const regex = new RegExp(`(${field}\\s*[:=-]\\s*)([^,\\s"'}\\]]+)`, 'gi');

    result = result.replace(regex, (_, prefix: number, value: string) => {
      return prefix + maskValue(value, config);
    });
  }

  return result;
};
