import os from 'os';
import { LogLevel } from '../constants';
import { Level } from '../types';

export class LokiMapper {
  public static map(
    requestId: string,
    messageId: string,
    level: Level,
    context: string,
    message: string,
    params?: unknown[],
  ): unknown {
    return {
      level: LogLevel[level],
      time: Date.now(),
      pid: process.pid,
      rid: requestId,
      mid: messageId,
      hostname: os.hostname(),
      context,
      msg: message,
      ...(params?.length ? { params } : {}),
    };
  }
}
