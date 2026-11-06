# @silkon/crypto

Cryptographic utilities and envelope encryption services for Silkon applications and Node.js runtimes.

This package provides authenticated symmetric encryption (AES-256-GCM), HKDF key derivation, optional Brotli compression, and typed payload handling (strings, JSON objects, and binary buffers).

## Installation

```bash
npm install @silkon/crypto @silkon/common
```

## Quick start

### Envelope Encryption (`EnvelopeService`)

`EnvelopeService` provides high-level authenticated encryption and automatic serialization/deserialization for various data types, with optional Brotli compression when it reduces payload size:

```typescript
import { EnvelopeService } from '@silkon/crypto';

const secretKey = 'your-secret-encryption-key';
const envelope = new EnvelopeService(secretKey);

// 1. Encrypt and decrypt JSON objects
const data = { id: 1, name: 'silkon', active: true };
const encryptedJson = await envelope.encrypt(data);
const decryptedJson = await envelope.decrypt<typeof data>(encryptedJson);
console.log(decryptedJson.name); // 'silkon'

// 2. Encrypt and decrypt strings
const encryptedText = await envelope.encrypt('hello world');
const decryptedText = await envelope.decrypt<string>(encryptedText);
console.log(decryptedText); // 'hello world'

// 3. Encrypt and decrypt binary Buffers
const buffer = Buffer.from([0, 255, 10, 13, 128, 127]);
const encryptedBuffer = await envelope.encrypt(buffer);
const decryptedBuffer = await envelope.decrypt<Buffer>(encryptedBuffer);
```

### Low-Level Buffer Encryption (`CryptoService`)

`CryptoService` operates directly on binary `Buffer` instances using AES-256-GCM and HKDF key derivation:

```typescript
import { CryptoService } from '@silkon/crypto';

const cryptoService = new CryptoService('your-secret-key');
const rawData = Buffer.from('confidential binary data');

const encrypted = cryptoService.encrypt(rawData);
const decrypted = cryptoService.decrypt(encrypted);
```

### Brotli Compression (`ZipService` & Utils)

`ZipService` provides async Brotli compression and decompression with configurable maximum output size limits for decompression bomb protection:

```typescript
import { ZipService, zip, unzip } from '@silkon/crypto';

// Using ZipService
const zipService = new ZipService();
const compressed = await zipService.compress(Buffer.from('compressible text content'));
const decompressed = await zipService.decompress(compressed);

// Using standalone utility functions
const zipped = await zip(Buffer.from('data'));
const unzipped = await unzip(zipped);
```

## Architecture & Security Details

- **Cipher**: AES-256-GCM (`aes-256-gcm`).
- **Key Derivation**: HKDF (`sha256`) with a 16-byte random salt, 32-byte derived key length, and application info context `silkon/crypto/v1`.
- **Initialization Vector**: 12-byte cryptographically secure random IV per encryption operation.
- **Authentication**: 16-byte GCM authentication tag.
- **Binary Wire Framing**: `[ 16B Salt | 12B IV | 16B Auth Tag | Ciphertext ]`.
- **Envelope Framing**: Encrypted payload contains a 1-byte header encoding compression flags and data type kind (`STRING`, `JSON`, or `BINARY`), returning base64-encoded ciphertext.

## Public API

The package root exports:

### Services

- `EnvelopeService`: High-level envelope encryption with type handling and adaptive compression.
  - `constructor(key: string, compress = true)`
  - `encrypt(input: Input, compress?: boolean): Promise<string>`
  - `decrypt<T = unknown>(input: string): Promise<T>`
- `CryptoService`: Low-level buffer encryption with AES-256-GCM and HKDF key derivation.
  - `constructor(key: string)`
  - `encrypt(data: Buffer): Buffer`
  - `decrypt(data: Buffer): Buffer`
- `ZipService`: Brotli compression service with decompression size limits.
  - `constructor(maxSize: number = 100 * 1024 * 1024)`
  - `compress(data: Buffer): Promise<Buffer>`
  - `decompress(data: Buffer): Promise<Buffer>`

### Utilities

- `zip(data: Buffer, options?: BrotliOptions): Promise<Buffer>`: Promisified `brotliCompress`.
- `unzip(data: Buffer, options?: BrotliOptions): Promise<Buffer>`: Promisified `brotliDecompress`.

## Build

This package is built with TypeScript project references and publishes the compiled output in `dist/`.

```bash
npm run build
```

## Package details

- Name: `@silkon/crypto`
- Peer dependencies: `@silkon/common`
- Module type: CommonJS
- Entry point: `dist/index.js`
- Types: `dist/index.d.ts`
