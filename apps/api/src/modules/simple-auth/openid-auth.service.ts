import { Injectable } from '@nestjs/common';

import { Clock } from '../framework/clock';
import { PrismaService } from '../framework/database';

import { AuthSession } from './domain/auth-session';
import { OpenIdAuthenticationRequestFinder } from './infrastructure/finders/openid-authentication-request.finder';
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository';
import { OpenId } from './openid/openid';
import { OpenIdProvider } from './openid/openid.provider';

@Injectable()
export class OpenIdAuthService {
  constructor(
    private readonly userRepository: AuthUserRepository,
    private readonly openIdRequestFinder: OpenIdAuthenticationRequestFinder,
    private readonly openId: OpenId,
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
  ) {}

  async prepare(command: { provider: OpenIdProvider }): Promise<{ url: URL }> {
    const request = this.openId.for(command.provider).request();

    const { expiresAt, createdAt, nonce, challenge } = request.state;
    await this.prisma.openIdRequest.create({
      data: {
        expiresAt,
        createdAt,
        id: request.id,
        provider: request.provider,
        challenge: challenge ? Uint8Array.from(challenge.toBuffer()) : undefined,
        nonce: Uint8Array.from(nonce),
      },
    });

    return { url: request.authorizationUrl };
  }

  async login(command: { code: string; state: string; provider: OpenIdProvider }): Promise<AuthSession> {
    const request = await this.openIdRequestFinder.find({
      state: command.state,
      provider: command.provider,
    });

    const { email } = await this.openId.for(command.provider).authenticate({
      request,
      code: command.code,
    });

    const user = await this.userRepository.findByEmail(email);
    const session = await user.authenticate({
      now: this.clock.now(),
      type: 'openid',
      request: { id: request.id, provider: command.provider },
    });
    await this.userRepository.persist(user);

    return session;
  }
}
