import { Inject, Injectable } from '@nestjs/common';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';

@Injectable()
export class FindMachineQuery {
  private readonly tokens: readonly string[];
  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    this.tokens = config.apiTokens;
  }

  async handle(query: { bearer: string }): Promise<{ token: string } | null> {
    if (this.tokens.includes(query.bearer)) return { token: query.bearer };

    return null;
  }
}
