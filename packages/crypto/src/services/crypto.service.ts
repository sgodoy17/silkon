import {
  CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

export class CryptoService {
  private readonly mode: CipherGCMTypes = 'aes-256-gcm';
  private readonly saltLength: number = 16;
  private readonly ivLength: number = 12;
  private readonly tagLength: number = 16;

  constructor(private readonly key: string) {}

  public encrypt(data: Buffer): Buffer {
    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);

    const cipher = createCipheriv(this.mode, this.derive(salt), iv, {
      authTagLength: this.tagLength,
    });

    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, ciphertext]);
  }

  public decrypt(data: Buffer): Buffer {
    const saltOffset = 0;
    const ivOffset = saltOffset + this.saltLength;
    const tagOffset = ivOffset + this.ivLength;
    const dataOffset = tagOffset + this.tagLength;
    const salt = data.subarray(saltOffset, ivOffset);
    const iv = data.subarray(ivOffset, tagOffset);
    const tag = data.subarray(tagOffset, dataOffset);
    const ciphertext = data.subarray(dataOffset);

    const decipher = createDecipheriv(this.mode, this.derive(salt), iv, {
      authTagLength: this.tagLength,
    });

    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private derive(salt: Buffer): Buffer {
    return Buffer.from(hkdfSync('sha256', this.key, salt, 'silkon/crypto/v1', 32));
  }
}
