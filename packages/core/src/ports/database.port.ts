export interface DatabasePort {
  connect(): Promise<void>;

  close(): Promise<void>;
}
