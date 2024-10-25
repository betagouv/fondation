export type ApiConfig<Prod extends boolean = boolean> = {
  database: Prod extends true
    ? { connectionString: string }
    : {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
      };
};
