import { maskValue } from './mask-value.util';

export const maskEmail = (email: string): string => {
  const at = email.indexOf('@');

  if (at === -1) {
    return maskValue(email, { prefix: 1, suffix: 1 });
  }

  const local = email.substring(0, at);
  const domain = email.substring(at + 1);

  if (local.length <= 1) {
    return `*@${domain}`;
  }

  return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
};
