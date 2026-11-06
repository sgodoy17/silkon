export class InputHelper {
  public static key(value: string, name: string, id: string, stage: string): string {
    const key = value
      ? Buffer.from(`${value}-${name}-${id}`)
      : Buffer.from(`loki-${stage ?? 'local'}-${name}-${id}`);

    return key.toString('base64');
  }
}
