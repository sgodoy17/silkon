import { constants } from 'node:zlib';
import { unzip, zip } from '../utils';

export class ZipService {
  constructor(private readonly maxSize: number = 100 * 1024 * 1024) {}

  public compress(data: Buffer): Buffer {
    return zip(data, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
      },
    });
  }

  public decompress(data: Buffer): Buffer {
    return unzip(data, { maxOutputLength: this.maxSize });
  }
}
