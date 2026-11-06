import { promisify } from 'node:util';
import { brotliCompress } from 'node:zlib';

export const zip = promisify(brotliCompress);
