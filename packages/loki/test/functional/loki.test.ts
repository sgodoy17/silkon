import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';

import { HttpClient, LogLevel, loki, LokiService, LokiSetting } from '../../src';

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
      message: string;
      params: [{ orderId: number }];
    };

    expect(infoLog.level).toBe(LogLevel.info);
    expect(infoLog.context).toBe('OrderController');
    expect(infoLog.message).toBe('Order created successfully');
    expect(infoLog.params).toEqual([{ orderId: 1001 }]);

    const warnLog = JSON.parse(stdoutLogs[1].trim()) as { level: number; message: string };

    expect(warnLog.level).toBe(LogLevel.warn);
    expect(warnLog.message).toBe('Low inventory warning');

    const errorLog = JSON.parse(stdoutLogs[2].trim()) as { level: number; message: string };

    expect(errorLog.level).toBe(LogLevel.error);
    expect(errorLog.message).toBe('Payment gateway failed');

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
      message: 'Order created successfully',
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
      expect(item.stream.env).toBe('development');
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

  it('applies data masking to messages and parameters when mask options are configured', async () => {
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

    logger.info(
      'AuthContext',
      'User email: user@example.com logged in',
      {
        email: 'user@example.com',
        token: 'secret-token-123',
        meta: { unmasked: 'value', email: 'nested@example.com' },
      },
      ['array-item', { email: 'array-nested@example.com' }],
    );

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      message: string;
      params: [
        { email: string; token: string; meta: { unmasked: string; email: string } },
        [string, { email: string }],
      ];
    };

    expect(logged.message).toBe('User email: u***@example.com logged in');
    expect(logged.params[0].email).toBe('u***@example.com');
    expect(logged.params[0].token).toBe('se************23');
    expect(logged.params[0].meta.unmasked).toBe('value');
    expect(logged.params[0].meta.email).toBe('n*****@example.com');
    expect(logged.params[1][0]).toBe('array-item');
    expect(logged.params[1][1].email).toBe('a***********@example.com');

    await logger.flush();

    expect(receivedRequests).toHaveLength(1);

    const payload = JSON.parse(receivedRequests[0].body) as {
      streams: { values: [string, string][] }[];
    };

    const streamLog = JSON.parse(payload.streams[0].values[0][1]) as typeof logged;

    expect(streamLog.message).toBe('User email: u***@example.com logged in');
    expect(streamLog.params[0].email).toBe('u***@example.com');
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
      message: string;
      params: [{ email: string }];
    };

    expect(logged.message).toBe('User user@example.com logged in');
    expect(logged.params[0].email).toBe('user@example.com');

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
      message: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.message).toContain('Got an error when trying to send log to Loki');
    expect(fatalLog.message).toContain('Loki rejected logs: 400');
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
      message: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.message).toContain('Got an error when trying to send log to Loki');
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
      message: string;
    };

    expect(fatalLog.level).toBe(LogLevel.fatal);
    expect(fatalLog.message).toContain('Got an error when trying to send log to Loki');
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

    logger.info('EdgeContext', 'Status update', null, undefined, 42, true, false, {
      token: 'secret',
      count: 10,
      active: true,
      absent: null,
    });

    expect(stdoutLogs).toHaveLength(1);

    const logged = JSON.parse(stdoutLogs[0].trim()) as {
      params: [
        null,
        null,
        number,
        boolean,
        boolean,
        { token: string; count: number; active: boolean; absent: null },
      ];
    };

    expect(logged.params[2]).toBe(42);
    expect(logged.params[3]).toBe(true);
    expect(logged.params[4]).toBe(false);
    expect(logged.params[5].token).toBe('s****t');
    expect(logged.params[5].count).toBe(10);
    expect(logged.params[5].active).toBe(true);
    expect(logged.params[5].absent).toBeNull();
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
});
