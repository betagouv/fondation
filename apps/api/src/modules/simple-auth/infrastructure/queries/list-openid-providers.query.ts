import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { OpenId, OPENID_PROVIDERS } from '../../openid';

@Injectable()
export class ListOpenIdProvidersQuery {
  constructor(private readonly openId: OpenId) {}

  handle(): ListedOpenIdProvidersDto {
    const providers: string[] = [];
    for (const id of OPENID_PROVIDERS) {
      try {
        const provider = this.openId.for(id);
        if (provider) providers.push(id);
      } catch {}
    }

    return { items: providers };
  }
}

export class ListedOpenIdProvidersDto extends createZodDto(
  z.object({
    items: z.array(z.string()),
  }),
) {}
