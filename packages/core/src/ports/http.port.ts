import { GenericPayload, Method } from '@silkon/common';

export interface HttpPort {
  invoke(method: Method, data: unknown, options: unknown): Promise<GenericPayload>;

  invoke(url: string, method: Method, data: unknown, options: unknown): Promise<GenericPayload>;
}
