import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import { OpenIdProvider } from 'src/modules/simple-auth/openid';
import { Id, makeId } from 'src/utils/id';

@Injectable()
export class OpenIdAuthenticationRequestFinder {
  private readonly logger = new Logger(OpenIdAuthenticationRequestFinder.name);

  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { provider: OpenIdProvider; state: string }): Promise<{
    challenge: Buffer | null;
    nonce: Buffer;
    createdAt: Date;
    expiresAt: Date;
    id: Id<'OpenIdRequest'>;
    provider: string;
  }> {
    const found = await this.db.tx.openIdRequest.findUnique({
      where: { primaryKey: { provider: query.provider, id: query.state } },
      select: {
        challenge: true,
        createdAt: true,
        expiresAt: true,
        id: true,
        nonce: true,
        provider: true,
      },
    });

    if (!found) {
      this.logger.warn(`OpenIdRequest (provider=${query.provider}, state=${query.state}) not found`);
      throw new NotFoundException();
    }

    return {
      ...found,
      id: makeId('OpenIdRequest', found.id),
      challenge: found.challenge ? Buffer.from(found.challenge) : null,
      nonce: Buffer.from(found.nonce),
    };
  }
}
