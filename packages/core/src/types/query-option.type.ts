import { GenericPayload } from '@silkon/common';

export type QueryOption = {
  filter?: GenericPayload;
  limit?: number;
  skip?: number;
  orderBy?: { column: string; sort: 'asc' | 'desc' };
  options?: GenericPayload;
};
