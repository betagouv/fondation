import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import {
  AuthImpersonationRevoked,
  AuthImpersonationStarted,
  AuthOpenIdRequestCompleted,
  AuthUser,
  AuthUserAuthenticated,
  AuthUserRegistered,
  AuthUserUnAuthenticated,
} from 'src/modules/simple-auth/domain/auth-user';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<AuthUser> {
    const user = await this.db.tx.user.findFirst({
      select: { id: true, password: true },
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) throw new NotFoundException();

    return AuthUser.from(user);
  }

  async find(id: string): Promise<AuthUser> {
    const user = await this.db.tx.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    });

    if (!user) throw new NotFoundException();

    return AuthUser.from(user);
  }

  @Transactional()
  async persist(user: AuthUser): Promise<void> {
    for (const event of user.messages) {
      if (event instanceof AuthUserRegistered) await this.persistUserRegistered(event);
      else if (event instanceof AuthUserAuthenticated) await this.persistUserAuthenticated(event);
      else if (event instanceof AuthUserUnAuthenticated) await this.persistAuthUserUnAuthenticated(event);
      else if (event instanceof AuthImpersonationStarted) await this.persistImpersonationStarted(event);
      else if (event instanceof AuthImpersonationRevoked) await this.persistImpersonationRevoked(event);
      else if (event instanceof AuthOpenIdRequestCompleted)
        await this.persistAuthOpenIdRequestCompleted(event);
      else assertNever(event);
    }
  }

  private persistUserAuthenticated(event: AuthUserAuthenticated) {
    const expiresAt = new Date(event.session.startedAt.getTime() + event.session.durationMs);

    return this.db.tx.authSession.create({
      data: {
        expiresAt,
        sessionId: event.session.id,
        createdAt: event.session.startedAt,
        user: { connect: { id: event.id } },
      },
    });
  }

  private persistUserRegistered(event: AuthUserRegistered) {
    return this.db.tx.user.create({
      data: {
        id: event.id,
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
        role: event.role,
        gender: event.gender,
      },
    });
  }

  private persistImpersonationStarted({ impersonation }: AuthImpersonationStarted) {
    return this.db.tx.authImpersonation.create({
      data: {
        id: impersonation.id,
        createdAt: impersonation.startedAt,
        expiresAt: impersonation.expiresAt,
        sessionId: impersonation.authSessionId,
        impersonatedUserId: impersonation.impersonateId,
      },
    });
  }

  private persistImpersonationRevoked({ impersonationId }: AuthImpersonationRevoked) {
    return this.db.tx.authImpersonation.deleteMany({
      where: { id: impersonationId },
    });
  }

  private persistAuthUserUnAuthenticated({ sessionId }: AuthUserUnAuthenticated) {
    return this.db.tx.authSession.delete({ where: { sessionId } });
  }

  private persistAuthOpenIdRequestCompleted(message: AuthOpenIdRequestCompleted) {
    return this.db.tx.openIdRequest.delete({
      where: { primaryKey: { id: message.request.id, provider: message.request.provider } },
    });
  }
}
