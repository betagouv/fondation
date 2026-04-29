import type { APIRequestContext, APIResponse } from '@playwright/test';

export class HttpClient {
  // see apps/api/.env.e2e
  private readonly token = 'FthDG8SXXzWD6eOzybymzXh1bHqHepZG';

  private readonly baseURL = 'http://localhost:3000';

  constructor(private readonly ctx: APIRequestContext) {}

  request(config: Parameters<APIRequestContext['fetch']>[1] & { url: string }): Promise<APIResponse> {
    const url = new URL(config.url, this.baseURL);
    return this.ctx.fetch(url.toString(), {
      failOnStatusCode: true,

      ...config,
      headers: {
        ...config.headers,
        authorization: `Bearer ${this.token}`
      }
    });
  }
}
