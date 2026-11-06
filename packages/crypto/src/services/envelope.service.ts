import { GeneralException } from '@silkon/common';
import { isString } from '@silkon/common';
import { DataType } from '../constants';
import { Input } from '../types';
import { CryptoService } from './crypto.service';
import { ZipService } from './zip.service';

export class EnvelopeService {
  private static readonly compressed = 0x80;
  private static readonly kind = 0x7f;
  private readonly cryptoService: CryptoService;
  private readonly zipService: ZipService;

  constructor(
    key: string,
    private readonly compress = true,
  ) {
    this.cryptoService = new CryptoService(key);
    this.zipService = new ZipService();
  }

  public encrypt(input: Input, compress = this.compress): string {
    const { kind, bytes } = this.serialize(input);
    const zipped = compress ? this.zipService.compress(bytes) : undefined;
    const useZip = zipped !== undefined && zipped.length < bytes.length;
    const body = useZip ? zipped : bytes;
    const header = useZip ? kind | EnvelopeService.compressed : kind;

    return this.cryptoService
      .encrypt(Buffer.concat([Buffer.from([header]), body]))
      .toString('base64');
  }

  public decrypt<T = unknown>(input: string): T {
    const framed = this.cryptoService.decrypt(Buffer.from(input, 'base64'));
    const header = framed[0];
    const body = framed.subarray(1);
    const bytes = header & EnvelopeService.compressed ? this.zipService.decompress(body) : body;

    switch (header & EnvelopeService.kind) {
      case DataType.STRING:
        return bytes.toString('utf8') as T;
      case DataType.BINARY:
        return bytes as T;
      case DataType.JSON:
        return JSON.parse(bytes.toString('utf8')) as T;
      default:
        throw new GeneralException('Invalid payload');
    }
  }

  private serialize(data: Input): { kind: number; bytes: Buffer } {
    if (isString(data)) {
      return { kind: DataType.STRING, bytes: Buffer.from(data, 'utf8') };
    }

    if (Buffer.isBuffer(data)) {
      return { kind: DataType.BINARY, bytes: data };
    }

    return { kind: DataType.JSON, bytes: Buffer.from(JSON.stringify(data), 'utf8') };
  }
}
