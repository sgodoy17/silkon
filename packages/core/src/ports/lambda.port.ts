import { GenericPayload } from '@silkon/common';

export interface LambdaPort {
  invoke(lambda: string, type: string, payload: GenericPayload): Promise<unknown>;
}
