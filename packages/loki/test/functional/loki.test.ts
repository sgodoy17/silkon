import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { EnvelopeService } from '@silkon/crypto';
import { HttpClient, InputHelper, LogLevel, loki, LokiService, LokiSetting } from '../../src';

describe('Loki functional tests', () => {
  let server: Server;
  let serverUrl: string;
  let receivedRequests: {
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  }[];
  let serverStatusCode: number;
  let serverDelayMs: number;
  let pendingTimeouts: Set<NodeJS.Timeout>;
  let stdoutWriteSpy: jest.SpyInstance;
  let stdoutLogs: string[];

  beforeAll(async () => {
    receivedRequests = [];
    serverStatusCode = 204;
    serverDelayMs = 0;
    pendingTimeouts = new Set();

    server = createServer((req, res) => {
      let body = '';

      req.on('data', chunk => {
        body += chunk;
      });

      req.on('end', () => {
        receivedRequests.push({
          url: req.url,
          headers: req.headers,
          body,
        });

        if (serverDelayMs > 0) {
          const timeoutId = setTimeout(() => {
            pendingTimeouts.delete(timeoutId);
            res.statusCode = serverStatusCode;
            res.end();
          }, serverDelayMs);

          pendingTimeouts.add(timeoutId);

          req.on('close', () => {
            clearTimeout(timeoutId);
            pendingTimeouts.delete(timeoutId);
          });
        } else {
          res.statusCode = serverStatusCode;
          res.end();
        }
      });
    });

    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address() as AddressInfo;

    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    for (const timeoutId of pendingTimeouts) {
      clearTimeout(timeoutId);
    }
    pendingTimeouts.clear();

    await new Promise<void>((resolve, reject) => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    receivedRequests = [];
    serverStatusCode = 204;
    serverDelayMs = 0;
    stdoutLogs = [];

    stdoutWriteSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: string | Uint8Array) => {
        stdoutLogs.push(chunk.toString());
        return true;
      });
  });

  afterEach(() => {
    for (const timeoutId of pendingTimeouts) {
      clearTimeout(timeoutId);
    }

    pendingTimeouts.clear();
    stdoutWriteSpy.mockRestore();
  });

  it('initializes logger via loki factory function and handles full log and flush lifecycle', async () => {
    const config: LokiSetting = {
      url: serverUrl,
      name: 'order-service',
      stage: 'production',
      job: 'order_lambda',
      pattern: 'json',
      headers: {
        'X-Custom-Header': 'silkon-test',
      },
    };

    const logger = loki(config);

    logger.info('OrderController', 'Order created successfully', { orderId: 1001 });
    logger.warn('OrderController', 'Low inventory warning', { stock: 2 });
    logger.error('OrderController', 'Payment gateway failed', { reason: 'Timeout' });

    expect(stdoutLogs).toHaveLength(3);

    const infoLog = JSON.parse(stdoutLogs[0].trim()) as {
      level: number;
      context: string;
      msg: string;
      payload: { orderId: number };
    };

    expect(infoLog.level).toBe(LogLevel.info);
    expect(infoLog.context).toBe('OrderController');
    expect(infoLog.msg).toBe('Order created successfully');
    expect(infoLog.payload).toEqual({ orderId: 1001 });

    const warnLog = JSON.parse(stdoutLogs[1].trim()) as { level: number; msg: string };

    expect(warnLog.level).toBe(LogLevel.warn);
    expect(warnLog.msg).toBe('Low inventory warning');

    const errorLog = JSON.parse(stdoutLogs[2].trim()) as { level: number; msg: string };

    expect(errorLog.level).toBe(LogLevel.error);
    expect(errorLog.msg).toBe('Payment gateway failed');

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);

    const request = receivedRequests[0];

    expect(request.url).toBe('/loki/api/v1/push');
    expect(request.headers['content-type']).toBe('application/json');
    expect(request.headers['x-custom-header']).toBe('silkon-test');

    const payload = JSON.parse(request.body) as {
      streams: {
        stream: {
          job: string;
          env: string;
          lambda_name: string;
          level: string;
          log_pattern: string;
        };
        values: [string, string][];
      }[];
    };

    expect(payload.streams).toHaveLength(3);

    const streamMap = new Map(payload.streams.map(s => [s.stream.level, s]));
    const infoStream = streamMap.get('info');

    expect(infoStream?.stream).toEqual({
      job: 'order_lambda',
      env: 'production',
      lambda_name: 'order-service',
      level: 'info',
      log_pattern: 'json',
    });

    expect(infoStream?.values).toHaveLength(1);

    expect(JSON.parse(infoStream?.values[0][1] ?? '{}')).toMatchObject({
      level: LogLevel.info,
      context: 'OrderController',
      msg: 'Order created successfully',
    });

    const warnStream = streamMap.get('warn');

    expect(warnStream?.stream.level).toBe('warn');
    expect(warnStream?.values).toHaveLength(1);

    const errorStream = streamMap.get('error');

    expect(errorStream?.stream.level).toBe('error');
    expect(errorStream?.values).toHaveLength(1);
  });

  it('supports all log levels and default configuration fallbacks', async () => {
    const service = new LokiService({
      url: serverUrl,
      name: 'default-service',
    });

    service.trace('System', 'trace message');
    service.debug('System', 'debug message');
    service.info('System', 'info message');
    service.warn('System', 'warn message');
    service.error('System', 'error message');
    service.fatal('System', 'fatal message');

    expect(stdoutLogs).toHaveLength(6);

    const levels = stdoutLogs.map(log => (JSON.parse(log.trim()) as { level: number }).level);

    expect(levels).toEqual([
      LogLevel.trace,
      LogLevel.debug,
      LogLevel.info,
      LogLevel.warn,
      LogLevel.error,
      LogLevel.fatal,
    ]);

    await service.flush();

    expect(receivedRequests).toHaveLength(1);

    const payload = JSON.parse(receivedRequests[0].body) as {
      streams: { stream: Record<string, string> }[];
    };

    expect(payload.streams).toHaveLength(6);

    for (const item of payload.streams) {
      expect(item.stream.job).toBe('lambda_logs');
      expect(item.stream.env).toBe('local');
      expect(item.stream.log_pattern).toBe('default');
      expect(item.stream.lambda_name).toBe('default-service');
    }
  });

  it('clears buffered streams after flush so subsequent flush does not re-send', async () => {
    const logger = loki({
      url: serverUrl,
      name: 'single-flush-service',
    });

    logger.info('Test', 'first log');
    await logger.flush();
    expect(receivedRequests).toHaveLength(1);

    await logger.flush();
    expect(receivedRequests).toHaveLength(1);

    logger.info('Test', 'second log');
    await logger.flush();
    expect(receivedRequests).toHaveLength(2);
  });

  it('does nothing on flush when no logs have been recorded', async () => {
    const logger = loki({
      url: serverUrl,
      name: 'empty-service',
    });

    await logger.flush();
    expect(receivedRequests).toHaveLength(0);
  });

  it('applies data masking to messages and payload when mask options are configured', async () => {
    const logger = loki({
      url: serverUrl,
      name: 'masked-service',
      mask: {
        enabled: true,
        fields: {
          email: { type: 'email' },
          token: { prefix: 2, suffix: 2 },
        },
      },
    });

    logger.info('AuthContext', 'User email: user@example.com logged in', {
      email: 'user@example.com',
      token: 'secret-token-123',
      meta: { unmasked: 'value', email: 'nested@example.com' },
      list: ['array-item', { email: 'array-nested@example.com' }],
    });

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      msg: string;
      payload: {
        email: string;
        token: string;
        meta: { unmasked: string; email: string };
        list: [string, { email: string }];
      };
    };

    expect(logged.msg).toBe('User email: u***@example.com logged in');
    expect(logged.payload.email).toBe('u***@example.com');
    expect(logged.payload.token).toBe('se************23');
    expect(logged.payload.meta.unmasked).toBe('value');
    expect(logged.payload.meta.email).toBe('n*****@example.com');
    expect(logged.payload.list[0]).toBe('array-item');
    expect(logged.payload.list[1].email).toBe('a***********@example.com');

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);

    const payload = JSON.parse(receivedRequests[0].body) as {
      streams: { values: [string, string][] }[];
    };

    const streamLog = JSON.parse(payload.streams[0].values[0][1]) as typeof logged;

    expect(streamLog.msg).toBe('User email: u***@example.com logged in');
    expect(streamLog.payload.email).toBe('u***@example.com');
  });

  it('does not mask data when mask option is disabled', async () => {
    const logger = loki({
      url: serverUrl,
      name: 'unmasked-service',
      mask: {
        enabled: false,
        fields: {
          email: { type: 'email' },
        },
      },
    });

    logger.info('AuthContext', 'User user@example.com logged in', {
      email: 'user@example.com',
    });

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      msg: string;
      payload: { email: string };
    };

    expect(logged.msg).toBe('User user@example.com logged in');
    expect(logged.payload.email).toBe('user@example.com');

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);
  });

  it('handles Loki server error responses gracefully by writing a fatal error to stdout', async () => {
    serverStatusCode = 400;

    const logger = loki({
      url: serverUrl,
      name: 'error-handling-service',
    });

    logger.error('PaymentService', 'Payment failed');

    expect(stdoutLogs).toHaveLength(1);

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);
    expect(stdoutLogs).toHaveLength(2);

    const fatalLog = JSON.parse(stdoutLogs[1].trim()) as {
      level: number;
      msg: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.msg).toContain('Got an error when trying to send log to Loki');
    expect(fatalLog.msg).toContain('Loki rejected logs: 400');
  });

  it('handles connection failures gracefully by writing a fatal error to stdout', async () => {
    const logger = loki({
      url: 'http://127.0.0.1:1',
      name: 'unreachable-service',
    });

    logger.info('NetworkContext', 'Attempting send');

    expect(stdoutLogs).toHaveLength(1);

    await logger.flush();

    expect(stdoutLogs).toHaveLength(2);

    const fatalLog = JSON.parse(stdoutLogs[1].trim()) as {
      level: number;
      msg: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.msg).toContain('Got an error when trying to send log to Loki');
  });

  it('handles request timeouts gracefully by writing a fatal error to stdout', async () => {
    serverDelayMs = 2000;

    const logger = loki({
      url: serverUrl,
      name: 'timeout-service',
    });

    logger.info('TimeoutContext', 'Slow request message');

    expect(stdoutLogs).toHaveLength(1);

    await logger.flush();

    expect(stdoutLogs).toHaveLength(2);

    const fatalLog = JSON.parse(stdoutLogs[1].trim()) as {
      level: number;
      msg: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.msg).toContain('Got an error when trying to send log to Loki');
  });

  it('handles large payloads over 0.5 MB with adjusted timeout and successful flush', async () => {
    const logger = loki({
      url: new URL(serverUrl),
      name: 'large-payload-service',
    });

    const largeString = 'x'.repeat(600 * 1024);

    logger.info('LargeContext', 'Large message payload', { data: largeString });

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);
    expect(receivedRequests[0].headers['content-type']).toBe('application/json');

    const contentLength = Number(receivedRequests[0].headers['content-length']);

    expect(contentLength).toBeGreaterThan(500 * 1024);
  });

  it('handles masking edge cases with primitive values, null, and empty fields gracefully', () => {
    const logger = loki({
      url: serverUrl,
      name: 'edge-case-service',
      mask: {
        enabled: true,
        fields: {
          token: { prefix: 1, suffix: 1 },
        },
      },
    });

    logger.info('EdgeContext', 'Status update', {
      token: 'secret',
      count: 10,
      active: true,
      absent: null,
    });

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      payload: { token: string; count: number; active: boolean; absent: null };
    };

    expect(logged.payload.token).toBe('s****t');
    expect(logged.payload.count).toBe(10);
    expect(logged.payload.active).toBe(true);
    expect(logged.payload.absent).toBeNull();
  });

  it('allows injecting a custom HttpClient instance', async () => {
    const customClient = new HttpClient();
    const postSpy = jest.spyOn(customClient, 'post');

    const service = new LokiService(
      {
        url: serverUrl,
        name: 'custom-client-service',
      },
      customClient,
    );

    service.info('CustomClient', 'Testing injection');

    await service.flush();

    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('sets requestId via setId and attaches rid to each log entry and Loki stream value', async () => {
    const requestId = 'req-trace-uuid-12345';
    const messageId = 'msg-trace-uuid-12345';

    const logger = loki({
      url: serverUrl,
      name: 'request-id-service',
      stage: 'production',
    });

    logger.setRequestId(requestId);
    logger.setMessageId(messageId);
    logger.info('OrderController', 'Order placed', { orderId: 456 });
    logger.warn('InventoryController', 'Low stock', { productId: 789 });

    expect(stdoutLogs).toHaveLength(2);

    for (const logStr of stdoutLogs) {
      const entry = JSON.parse(logStr.trim()) as {
        rid?: string;
        mid?: string;
        context: string;
        msg: string;
      };

      expect(entry.rid).toBe(requestId);
      expect(entry.mid).toBe(messageId);
    }

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);

    const payload = JSON.parse(receivedRequests[0].body) as {
      streams: {
        stream: Record<string, string>;
        values: [string, string][];
      }[];
    };

    expect(payload.streams).toHaveLength(2);

    for (const item of payload.streams) {
      for (const [, val] of item.values) {
        const parsedValue = JSON.parse(val) as {
          rid?: string;
          msg: string;
        };

        expect(parsedValue.rid).toBe(requestId);
      }
    }
  });

  it('encrypts payload using EnvelopeService and default key based on stage, name, and requestId', async () => {
    const requestId = 'req-encrypt-123';

    const logger = loki({
      url: serverUrl,
      name: 'secure-service',
      stage: 'staging',
      input: {
        encrypt: true,
      },
    });

    logger.clean().setRequestId(requestId);

    const inputData = { user: 'alice', secret: 42, nested: { enabled: true } };

    logger.info('SecureContext', 'Encrypted action', inputData);

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      msg: string;
      payload: string;
    };

    expect(logged.msg).toBe('Encrypted action');
    expect(typeof logged.payload).toBe('string');
    expect(logged.payload).not.toEqual(inputData);

    const key = InputHelper.key('', 'secure-service', requestId, 'staging');
    const envelope = new EnvelopeService(key);
    const decrypted = envelope.decrypt(logged.payload);

    expect(decrypted).toEqual(inputData);

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);

    const payload = JSON.parse(receivedRequests[0].body) as {
      streams: { values: [string, string][] }[];
    };

    const streamLog = JSON.parse(payload.streams[0].values[0][1]) as typeof logged;

    expect(envelope.decrypt(streamLog.payload)).toEqual(inputData);
  });

  it('encrypts payload using custom key when input.key is specified', () => {
    const requestId = 'req-custom-key-456';
    const customKey = 'my-custom-secret-key';
    const logger = loki({
      url: serverUrl,
      name: 'custom-key-service',
      stage: 'production',
      input: {
        encrypt: true,
        key: customKey,
      },
    });

    logger.setRequestId(requestId);

    const inputData = { token: 'auth-token-xyz', active: true };

    logger.info('CustomKeyContext', 'Custom key action', inputData);

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      msg: string;
      payload: string;
    };

    expect(typeof logged.payload).toBe('string');

    const key = InputHelper.key(customKey, 'custom-key-service', requestId, 'production');
    const envelope = new EnvelopeService(key);
    const decrypted = envelope.decrypt(logged.payload);

    expect(decrypted).toEqual(inputData);
  });

  it('generates base64 key correctly via InputHelper.key helper', () => {
    const withCustomKey = InputHelper.key('custom', 'svc', 'req-1', 'prod');

    expect(withCustomKey).toBe(Buffer.from('custom-svc-req-1').toString('base64'));

    const withStageFallback = InputHelper.key('', 'svc', 'req-2', 'prod');

    expect(withStageFallback).toBe(Buffer.from('loki-prod-svc-req-2').toString('base64'));

    const withDefaultLocalStage = InputHelper.key('', 'svc', 'req-3', undefined);

    expect(withDefaultLocalStage).toBe(Buffer.from('loki-local-svc-req-3').toString('base64'));
  });
});
