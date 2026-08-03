export class ObjectHelper {
  public static isValid(data: unknown, key: string): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const keys = key.split('.');
    let current: unknown = data;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null || !(k in current)) {
        return false;
      }

      current = current[k];

      if (current === null) {
        return false;
      }
    }

    return true;
  }

  public static getValue<T>(data: unknown, key: string, convert: boolean = false): T | undefined {
    const value = this.resolveNestedKey(data, key);

    return this.transformValue<T>(value, convert);
  }

  private static resolveNestedKey(data: unknown, key: string): unknown {
    if (typeof data !== 'object' || data === null) {
      return undefined;
    }

    const keys = key.split('.');
    let result: unknown = data;

    for (const k of keys) {
      if (typeof result !== 'object' || result === null || !(k in result)) {
        return undefined;
      }

      result = (result as Record<string, unknown>)[k];
    }

    return result;
  }

  private static transformValue<T>(value: unknown, convert: boolean): T | undefined {
    if (convert) {
      if (typeof value === 'string') {
        if (!Number.isNaN(Number(value))) {
          return Number(value) as unknown as T;
        }

        const normalized = value.trim().toLowerCase();

        if (normalized === 'true' || normalized === 'false') {
          return (normalized === 'true') as unknown as T;
        }
      }

      if (Array.isArray(value)) {
        return value as T;
      }

      if (([] as unknown as T) instanceof Array) {
        return [value] as unknown as T;
      }
    }

    return value as T;
  }
}
