# @silkon/loki

Grafana Loki logger implementation for Node.js runtime and Silkon applications.

This package provides a structured logger that writes synchronous NDJSON logs to standard output and pushes batched log streams to Grafana Loki via HTTP/HTTPS, implementing structured logging with built-in sensitive data masking for serverless and Node.js applications.

## Installation

```bash
npm install @silkon/loki @silkon/core @silkon/common
```

## Quick start

```typescript
import { loki, type LokiSetting } from '@silkon/loki';

const settings: LokiSetting = {
  url: 'http://localhost:3100',
  name: 'order-service',
  stage: 'production',
  job: 'order_lambda',
  pattern: 'json',
  mask: {
    enabled: true,
    fields: {
      email: { type: 'email' },
      token: { prefix: 2, suffix: 2 },
    },
  },
};

const logger = loki(settings);

// Log with (context, message, ...optionalParams)
logger.info('OrderController', 'Order created successfully', {
  orderId: 1042,
  email: 'customer@example.com',
  token: 'secret-token-12345',
});
logger.warn('OrderController', 'Low stock warning', { productId: 55, stock: 2 });
logger.error('OrderController', 'Payment processing failed', { reason: 'Timeout' });

// Ensure all buffered logs are pushed to Loki
await logger.flush();
```

## Logging Methods

`LokiService` provides standard severity logging methods following the signature `(context: string, message: string, ...params: unknown[])`:

- `logger.trace(context, message, ...params)`
- `logger.debug(context, message, ...params)`
- `logger.info(context, message, ...params)`
- `logger.warn(context, message, ...params)`
- `logger.error(context, message, ...params)`
- `logger.fatal(context, message, ...params)`
- `logger.flush()` — Sends all buffered log streams to the Loki `/loki/api/v1/push` endpoint.

## Configuration Options

The `LokiSetting` configuration object supports the following options:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string \| URL` | *(required)* | Loki endpoint URL (e.g. `http://localhost:3100` or `https://loki.example.com`). |
| `name` | `string` | *(required)* | Service or Lambda name (mapped to label `lambda_name`). |
| `stage` | `string` | `'development'` | Environment name (mapped to label `env`). |
| `job` | `string` | `'lambda_logs'` | Job identifier (mapped to label `job`). |
| `pattern` | `string` | `'default'` | Log pattern identifier (mapped to label `log_pattern`). |
| `headers` | `Record<string, string>` | `undefined` | Custom HTTP headers sent to Loki (e.g. `Authorization`, `X-Scope-OrgID`). |
| `mask` | `MaskOption` | `undefined` | Sensitive data masking configuration for messages and parameters. |
| `timeout` | `number` | `1000` | HTTP request timeout in milliseconds (dynamically extended for payloads > 0.5 MB). |

## Sensitive Data Masking

Sensitive data can be masked automatically across log messages and nested parameter objects:

```typescript
import { loki } from '@silkon/loki';

const logger = loki({
  url: 'http://localhost:3100',
  name: 'auth-service',
  mask: {
    enabled: true,
    fields: {
      email: { type: 'email' },
      apiKey: { prefix: 3, suffix: 2 },
      ssn: { mask: '***-**-****' },
    },
  },
});

logger.info('AuthService', 'User user@example.com authenticated', {
  email: 'user@example.com',
  apiKey: 'ak_live_987654321',
});
```

## Public API

The package root re-exports:

- **Factory**: `loki`
- **Services**: `LokiService`
- **Clients**: `HttpClient`
- **Constants**: `LogLevel`
- **Mappers**: `LokiMapper`
- **Processors**: `MaskProcessor`
- **Types**: `LokiSetting`, `LokiEntry`, `LokiStream`, `MaskOption`, `MaskField`

## Build

This package is built with TypeScript project references and publishes the compiled output in `dist/`.

```bash
npm run build
```

## Package details

- Name: `@silkon/loki`
- Peer dependency: `@silkon/core`, `@silkon/common`
- Entry point: `dist/index.js`
- Types: `dist/index.d.ts`
