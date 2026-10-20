import { LokiService } from '../services';
import { Logger, LokiSetting } from '../types';

export const loki = (config?: LokiSetting): Logger => new LokiService(config);
