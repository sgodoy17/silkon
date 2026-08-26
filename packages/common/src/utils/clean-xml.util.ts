import { isString } from './is-string.util';

export const cleanXml = (input: unknown) => {
  const text = isString(input) ? input : JSON.stringify(input);

  return text
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/\s+\/>/g, '/>')
    .replace('<?xml version="1.0" encoding="utf-8"?>', '')
    .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
    .trim();
};
