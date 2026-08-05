export interface HttpPort {
  invoke(request: unknown): Promise<unknown>;
}
