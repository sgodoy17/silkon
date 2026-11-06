import { Input } from '@silkon/common';
import { DateTimeHelper, ErrorHelper } from '@silkon/core';
import { EnvelopeService } from '@silkon/crypto';
import { HttpClient } from '../clients';
import { InputHelper, MaskHelper } from '../helpers';
import { LokiMapper } from '../mappers';
import { Level, LokiSetting, LokiStream } from '../types';

export class LokiService {
  private requestId: string;
  private messageId: string;
  private streams: Record<string, LokiStream> = {};
  private envelopeService: EnvelopeService;

  constructor(
    private readonly config: LokiSetting,
    private readonly httpClient: HttpClient = new HttpClient(),
  ) {}

  public info(context: string, message: string, input?: Input): void {
    this.entry('info', context, message, input);
  }

  public error(context: string, message: string, input?: Input): void {
    this.entry('error', context, message, input);
  }

  public warn(context: string, message: string, input?: Input): void {
    this.entry('warn', context, message, input);
  }

  public debug(context: string, message: string, input?: Input): void {
    this.entry('debug', context, message, input);
  }

  public trace(context: string, message: string, input?: Input): void {
    this.entry('trace', context, message, input);
  }

  public fatal(context: string, message: string, input?: Input): void {
    this.entry('fatal', context, message, input);
  }

  public clean(): LokiService {
    this.requestId = undefined;
    this.messageId = undefined;
    this.envelopeService = undefined;

    return this;
  }

  public setRequestId(requestId: string): LokiService {
    this.requestId = requestId;

    return this;
  }

  public setMessageId(messageId: string): LokiService {
    this.messageId = messageId;

    return this;
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

  private entry(level: Level, context: string, message: string, input?: Input): void {
    const { config, requestId } = this;
    const stage = config.stage;
    const payload = this.protect(input);

    const content = JSON.stringify(
      LokiMapper.map(
        requestId,
        this.messageId,
        level,
        context,
        MaskHelper.mask(message, config.mask),
        payload,
      ),
    );

    process.stdout.write(`${content}\n`);

    this.streams[level] ??= {
      stream: {
        job: config.job ?? 'lambda_logs',
        env: stage ?? 'local',
        lambda_name: config.name,
        level,
        log_pattern: config.pattern ?? 'default',
      },
      values: [],
    };

    this.streams[level].values.push([DateTimeHelper.getTimestamp(), content]);
  }

  private protect(input?: Input): Input | undefined {
    if (input === undefined) {
      return undefined;
    }

    const options = this.config.input;

    if (!options?.encrypt) {
      return MaskHelper.mask(input, this.config.mask);
    }

    this.envelopeService ??= new EnvelopeService(
      InputHelper.key(options.key, this.config.name, this.requestId, this.config.stage),
    );

    return this.envelopeService.encrypt(input);
  }
}
