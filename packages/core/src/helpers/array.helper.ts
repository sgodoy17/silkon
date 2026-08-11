import { isArray } from '@silkon/common';

export class ArrayHelper {
  public static toArray<T>(input: unknown): T {
    const data = isArray(input) && input.length > 0 ? input : [input];

    return data as T;
  }
}
