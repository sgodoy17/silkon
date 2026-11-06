export interface LoggerPort {
  log(message: string, input?: unknown, context?: string): void;

  error(message: string, input?: unknown, context?: string): void;

  warn(message: string, input?: unknown, context?: string): void;

  debug?(message: string, input?: unknown, context?: string): void;

  verbose?(message: string, input?: unknown, context?: string): void;

  fatal?(message: string, input?: unknown, context?: string): void;

  setRequestId(requestId: string): void;

  setMessageId(requestId: string): void;

  flush(): Promise<void>;
}
