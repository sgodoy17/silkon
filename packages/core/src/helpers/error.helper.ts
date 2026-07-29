import { GeneralException } from '@silkon/common';

import { BaseException } from '../exceptions';

export class ErrorHelper {
  protected static readonly UNKNOWN_ERROR = 'An unknown error occurred';

  public static getMessage(error: unknown): string {
    if (this.isError(error)) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return JSON.stringify(error.message);
    }

    return this.UNKNOWN_ERROR;
  }

  public static getType(error: unknown): string {
    return this.isError(error) ? error.name : 'UNKNOWN_ERROR';
  }

  public static getContext(error: unknown, context?: string): string | undefined {
    if (error instanceof BaseException) {
      return error?.context ? error.context : context;
    }

    return context;
  }

  public static quickError(message: string): void {
    throw new GeneralException(message);
  }

  protected static isError(error: unknown): error is Error {
    return error instanceof Error;
  }
}
