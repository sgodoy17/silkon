export interface HandlerPort<E, R> {
  execute(requestId: string, event: E): Promise<R>;
}
