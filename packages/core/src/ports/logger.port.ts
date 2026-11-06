export interface LoggerPort {
  log(message: string, input: unknown): void;

  error(message: string, input: unknown): void;

  warn(message: string, input: unknown): void;

  debug?(message: string, input: unknown): void;

  verbose?(message: string, input: unknown): void;

  fatal?(message: string, input: unknown): void;

  clean(): unknown;

  setRequestId(requestId: string): unknown;

  setMessageId(requestId: string): unknown;

  flush(): Promise<void>;
}
