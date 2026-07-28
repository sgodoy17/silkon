# @silkon/common

Shared runtime helpers, types, and error classes for Silkon packages.

## Installation

```bash
 npm install @silkon/common
```

## Quick start

```typescript
import { GeneralException, isString, type GenericPayload } from '@silkon/common';

const payload: GenericPayload = {
  name: 'silkon',
};

if (!isString(payload.name)) {
  throw new GeneralException('Expected name to be a string');
}
```

## Build

This package is built with TypeScript project references and publishes the compiled output in `dist/`.

```bash
npm run build
```

## Package details

- Name: `@silkon/common`
- Module type: CommonJS
- Entry point: `dist/index.js`
- Types: `dist/index.d.ts`
