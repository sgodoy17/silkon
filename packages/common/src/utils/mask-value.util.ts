import { Mask } from '../types';

import { maskEmail } from './mask-email.util';

export const maskValue = (value: string, config: Mask): string => {
  if (config.type === 'email') {
    return maskEmail(value);
  }

  const { prefix, suffix, length, character } = {
    prefix: 3,
    suffix: 3,
    length: 0,
    character: '*',
    ...config,
  };

  const start = prefix > 0 ? value.slice(0, prefix) : '';
  const end = suffix > 0 ? value.slice(-suffix) : '';

  const maskLength = length || Math.max(value.length - prefix - suffix, 0);

  return start + character.repeat(maskLength) + end;
};
