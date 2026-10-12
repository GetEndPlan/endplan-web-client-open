declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    user?: string;
    password?: string;
    host?: string;
    database?: string;
    port?: number;
    ssl?: boolean;
  }

  export interface QueryResult<T = unknown> {
    rows: T[];
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<unknown>;
    end(): Promise<void>;
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  }
}
