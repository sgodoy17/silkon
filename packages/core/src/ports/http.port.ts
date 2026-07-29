import { GenericPayload } from '@silkon/common';

export interface HttpPort {
  invoke(data: unknown, metadata: GenericPayload): Promise<GenericPayload>;
}
