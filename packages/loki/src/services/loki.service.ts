import { DateTimeHelper, ErrorHelper } from '@silkon/core';
import { HttpClient } from '../clients';
import { LokiMapper } from '../mappers';
import { MaskProcessor } from '../processors';
import { Level, LokiSetting, LokiStream } from '../types';

export class LokiService {
  private requestId: string;
  private messageId: string;
  private streams: Record<string, LokiStream> = {};

  constructor(
    private readonly config: LokiSetting,
    private readonly httpClient: HttpClient = new HttpClient(),
  ) {}

  public info(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('info', context, message, optionalParams);
  }

  public error(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('error', context, message, optionalParams);
  }

  public warn(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('warn', context, message, optionalParams);
  }

  public debug(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('debug', context, message, optionalParams);
  }

  public trace(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('trace', context, message, optionalParams);
  }

  public fatal(context: string, message: string, ...optionalParams: unknown[]): void {
    this.entry('fatal', context, message, optionalParams);
  }

  public setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  public setMessageId(messageId: string): void {
    this.messageId = messageId;
  }

  public async flush(): Promise<void> {
    const streams = Object.values(this.streams);

    if (streams.length === 0) {
      return;
    }

    this.streams = {};

    try {
      const payload = JSON.stringify({ streams });
      const url = new URL('loki/api/v1/push', this.config.url);
      const length = Buffer.byteLength(payload);

      await this.httpClient.post(url, payload, {
        method: 'POST',
        headers: {
          ...this.config.headers,
          'Content-Type': 'application/json',
          'Content-Length': length,
        },
        timeout: length / 1024 / 1024 > 0.5 ? 3_000 : 1_000,
      });
    } catch (error: unknown) {
      const message = `Got an error when trying to send log to Loki, error output: ${JSON.stringify(ErrorHelper.serialize(error))}`;

      process.stdout.write(
        `${JSON.stringify(LokiMapper.map(this.requestId, this.messageId, 'fatal', '', message))}\n`,
      );
    }
  }

  private entry(level: Level, context: string, message: string, params?: unknown[]): void {
    const options = this.config?.mask;

    const content = JSON.stringify(
      LokiMapper.map(
        this.requestId,
        this.messageId,
        level,
        context,
        MaskProcessor.mask(message, options),
        MaskProcessor.mask(params, options),
      ),
    );

    process.stdout.write(`${content}\n`);

    if (!this.streams[level]) {
      this.streams[level] = {
        stream: {
          job: this.config.job ?? 'lambda_logs',
          env: this.config.stage ?? 'development',
          lambda_name: this.config.name,
          level,
          log_pattern: this.config.pattern ?? 'default',
        },
        values: [],
      };
    }

    this.streams[level].values.push([DateTimeHelper.getTimestamp(), content]);
  }
}
