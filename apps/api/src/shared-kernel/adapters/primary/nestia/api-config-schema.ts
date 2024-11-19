export interface ApiConfig<Prod extends boolean = boolean> {
  port: number;
  database: Prod extends true
    ? { connectionString: string }
    : {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
      };
  contextServices: {
    filesContext: {
      baseUrl: string;
      port: number;
    };
  };
}
