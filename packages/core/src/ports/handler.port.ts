export interface HandlerPort {
  execute(requestId: string, event: unknown): Promise<unknown>;
}
