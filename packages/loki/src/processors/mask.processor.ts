import { maskString, maskValue } from '@silkon/common';
import { MaskField, MaskOption } from '../types';

export class MaskProcessor {
  public static mask<T>(value: T, options: MaskOption): T {
    if (!options?.enabled || !options.fields) {
      return value;
    }

    return this.walk(value, options.fields) as T;
  }

  private static walk(value: unknown, fields?: MaskField): unknown {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      return maskString(value, fields);
    }

    if (Array.isArray(value)) {
      return value.map(v => this.walk(v, fields));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(value)) {
        const config = fields?.[key];

        if (config && typeof val === 'string') {
          result[key] = maskValue(val, config);
        } else {
          result[key] = this.walk(val, fields);
        }
      }

      return result;
    }

    return value;
  }
}
