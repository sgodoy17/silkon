export class BaseException extends Error {
  context?: string;

  constructor(message: string, context?: string) {
    super(message);

    this.message = message;
    this.context = context;
  }
}
