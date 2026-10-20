import os from 'os';

import { LogLevel } from '../constants';
import { Level } from '../types';

export class LokiMapper {
  public static map(level: Level, context: string, message: string, params?: unknown[]): unknown {
    return {
      level: LogLevel[level],
      time: Date.now(),
      pid: process.pid,
      hostname: os.hostname(),
      context,
      message,
      ...(params?.length ? { params } : {}),
    };
  }
}
