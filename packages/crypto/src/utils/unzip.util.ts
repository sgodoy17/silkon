import { brotliDecompressSync } from 'node:zlib';

export const unzip = brotliDecompressSync;
