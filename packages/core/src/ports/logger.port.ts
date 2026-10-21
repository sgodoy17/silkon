import { GenericPayload } from '@silkon/common';

export interface LoggerPort {
  log(message: string, ...optionalParams: GenericPayload[]): void;

  error(message: string, ...optionalParams: GenericPayload[]): void;

  warn(message: string, ...optionalParams: GenericPayload[]): void;

  debug?(message: string, ...optionalParams: GenericPayload[]): void;

  verbose?(message: string, ...optionalParams: GenericPayload[]): void;

  fatal?(message: string, ...optionalParams: GenericPayload[]): void;

  setRequestId(requestId: string): void;

  setMessageId(requestId: string): void;

  flush(): Promise<void>;
}
