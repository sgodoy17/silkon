export type HttpOption = {
  method: string;
  headers?: Record<string, string | number>;
  timeout?: number;
};
