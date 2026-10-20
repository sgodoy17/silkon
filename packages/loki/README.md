# @silkon/loki

Grafana Loki logger implementation for Node.js runtime and Silkon applications.

This package provides a structured logger that pushes logs to Grafana Loki,
implementing the Silkon logger port for serverless and Node.js applications.

## Installation

```bash
npm install @silkon/loki @silkon/core @silkon/common
```

## Quick start

```typescript
import { LokiLogger, type LokiLoggerOptions } from '@silkon/loki';

const options: LokiLoggerOptions = {
  host: 'http://localhost:3100',
  labels: {
    app: 'my-service',
    environment: 'production',
  },
};

const logger = new LokiLogger(options);

logger.log('Application started successfully');
logger.warn('High memory usage detected', { usage: '85%' });
logger.error('Failed to process request', { error: 'Timeout' });

// Ensure buffered logs are sent to Loki
await logger.flush();
```

## Public API

The package root re-exports:

- `LokiLogger`
- `LokiLoggerOptions`

## Build

This package is built with TypeScript project references and publishes the
compiled output in `dist/`.

```bash
npm run build
```

## Package details

- Name: `@silkon/loki`
- Peer dependency: `@silkon/core`, `@silkon/common`
- Entry point: `dist/index.js`
- Types: `dist/index.d.ts`
