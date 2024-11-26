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
  s3: Prod extends true
    ? undefined
    : {
        bucketName: string;
        encryptionKey: string;
        endpoint: string;
        credentials: {
          accessKeyId: string;
          secretAccessKey: string;
        };
        /**
         * In seconds.
         */
        signedUrlExpiresIn: number;
      };
  contextServices: {
    filesContext: {
      baseUrl: string;
      port: number;
    };
  };
}
