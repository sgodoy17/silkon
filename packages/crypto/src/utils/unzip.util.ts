import { promisify } from 'node:util';
import { brotliDecompress } from 'node:zlib';

export const unzip = promisify(brotliDecompress);
