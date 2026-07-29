import { GenericPayload } from '@silkon/common';

export interface SNSPort {
  publish(topic: string, payload: GenericPayload): Promise<GenericPayload>;
}
