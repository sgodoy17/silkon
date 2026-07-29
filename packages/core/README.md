# @silkon/core

Core runtime primitives for Silkon applications.

This package exports the DI container, provider interfaces, shared ports,
helpers, exceptions, and core types used across the framework.

## Installation

```bash
npm install @silkon/core @silkon/common
```

## Quick start

```typescript
import {
  Container,
  type Provider,
} from '@silkon/core';

class Logger {
  log(message: string): void {
    console.log(message);
  }
}

const container = new Container();

const loggerProvider: Provider = {
  useClass: Logger,
};

container.register('logger', loggerProvider);

const logger = container.resolve<Logger>('logger');

logger.log('ready');
```

## Public API

The package root re-exports:

- `di`
- `exceptions`
- `helpers`
- `interfaces`
- `ports`
- `types`

Provider interfaces:

- `BaseProviderInterface`
- `ClassProviderInterface`
- `FactoryProviderInterface`
- `ValueProviderInterface`

Core exports:

- `Container`
- `Provider`
- `BaseException`
- `HandlerPort`
- `HttpPort`
- `LoggerPort`
- `SNSPort`

## Build

This package is built with TypeScript project references and publishes the
compiled output in `dist/`.

```bash
npm run build
```

## Package details

- Name: `@silkon/core`
- Peer dependency: `@silkon/common`
- Entry point: `dist/index.js`
- Types: `dist/index.d.ts`
