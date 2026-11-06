import { InputOption } from './input-option.type';
import { MaskOption } from './mask-option.type';

export type LokiSetting = {
  url: string | URL;
  name: string;
  stage?: string;
  pattern?: string;
  job?: string;
  headers?: Record<string, string>;
  mask?: MaskOption;
  input?: InputOption;
};
