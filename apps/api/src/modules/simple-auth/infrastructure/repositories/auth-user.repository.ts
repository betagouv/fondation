import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { Db } from '../../../framework/database';
import { userStatusOf } from '../../../shared/user-status.enum';
import {
  AuthImpersonationRevoked,
  AuthImpersonationStarted,
  AuthOpenIdRequestCompleted,
  AuthUser,
  AuthUserAuthenticated,
  AuthUserPasswordChanged,
  AuthUserPasswordRehashed,
  AuthUserRegistered,
  AuthUserSessionsRevoked,
  AuthUserUnAuthenticated,
} from '../../domain/auth-user';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.db.tx.user.findFirst({
      select: { deactivatedAt: true, id: true, password: true } satisfies Prisma.UserSelect,
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    return user && AuthUser.from({ ...user, status: userStatusOf(user) });
  }

  async find(id: string): Promise<AuthUser> {
    const user = await this.db.tx.user.findUnique({
      select: { deactivatedAt: true, id: true, password: true } satisfies Prisma.UserSelect,
      where: { id },
    });

    if (!user) throw new NotFoundException();

    return AuthUser.from({ ...user, status: userStatusOf(user) });
  }

  @Transactional()
  async persist(user: AuthUser): Promise<void> {
    for (const event of user.messages) {
      if (event instanceof AuthUserRegistered) await this.persistUserRegistered(event);
      else if (event instanceof AuthUserAuthenticated) await this.persistUserAuthenticated(event);
      else if (event instanceof AuthUserUnAuthenticated) await this.persistAuthUserUnAuthenticated(event);
      else if (event instanceof AuthUserSessionsRevoked) await this.persistAuthUserSessionsRevoked(event);
      else if (event instanceof AuthUserPasswordRehashed || event instanceof AuthUserPasswordChanged)
        await this.persistPassword(event);
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
        createdAt: event.session.startedAt,
        expiresAt,
        sessionId: event.session.id,
        user: { connect: { id: event.id } },
      },
    });
  }

  private async persistUserRegistered(event: AuthUserRegistered) {
    await this.db.tx.user.create({
      data: {
        createdAt: event.registeredAt,
        email: event.email,
        firstName: event.firstName,
        gender: event.gender,
        id: event.id,
        isAdmin: event.isAdmin,
        lastName: event.lastName,
        password: event.password,
        role: event.role,
      },
    });
    if (!event.isAdmin) return;

    await this.db.tx.adminRightChange.create({
      data: { change: 'GRANTED', changedAt: event.registeredAt, changedBy: null, userId: event.id },
    });
  }

  private persistPassword(event: AuthUserPasswordRehashed | AuthUserPasswordChanged) {
    return this.db.tx.user.update({ data: { password: event.password }, where: { id: event.id } });
  }

  private persistImpersonationStarted({ impersonation }: AuthImpersonationStarted) {
    return this.db.tx.authImpersonation.create({
      data: {
        createdAt: impersonation.startedAt,
        expiresAt: impersonation.expiresAt,
        id: impersonation.id,
        impersonatedUserId: impersonation.impersonateId,
        sessionId: impersonation.authSessionId,
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

  private persistAuthUserSessionsRevoked({ id, keptSessionId }: AuthUserSessionsRevoked) {
    return this.db.tx.authSession.deleteMany({ where: { sessionId: { not: keptSessionId }, userId: id } });
  }

  private persistAuthOpenIdRequestCompleted(message: AuthOpenIdRequestCompleted) {
    return this.db.tx.openIdRequest.delete({
      where: { primaryKey: { id: message.request.id, provider: message.request.provider } },
    });
  }
}
