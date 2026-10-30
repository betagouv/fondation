import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { Id, makeId } from '../../../../utils/id';
import { Db } from '../../../framework/database';
import { OpenIdProvider } from '../../openid';

@Injectable()
export class OpenIdAuthenticationRequestFinder {
  private readonly logger = new Logger(OpenIdAuthenticationRequestFinder.name);

  constructor(private readonly db: Db) {}

  @Transactional()
  async find(query: { provider: OpenIdProvider; state: string }): Promise<{
    challenge: Buffer;
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
      } satisfies Prisma.OpenIdRequestSelect,
    });

    if (!found) {
      this.logger.warn(`OpenIdRequest (provider=${query.provider}, state=${query.state}) not found`);
      throw new NotFoundException();
    }

    return {
      ...found,
      id: makeId('OpenIdRequest', found.id),
      challenge: Buffer.from(found.challenge),
      nonce: Buffer.from(found.nonce),
    };
  }
}
