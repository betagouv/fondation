import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
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
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      select: { id: true, password: true },
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) throw new NotFoundException();

    return AuthUser.from(user);
  }

  async find(id: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    });

    if (!user) throw new NotFoundException();

    return AuthUser.from(user);
  }

  persist(user: AuthUser) {
    return this.prisma.$transaction(
      user.messages.map((event) => {
        if (event instanceof AuthUserRegistered) {
          return this.persistUserRegistered(event);
        }

        if (event instanceof AuthUserAuthenticated) {
          return this.persistUserAuthenticated(event);
        }

        if (event instanceof AuthUserUnAuthenticated) {
          return this.persistAuthUserUnAuthenticated(event);
        }

        if (event instanceof AuthImpersonationStarted) {
          return this.persistImpersonationStarted(event);
        }

        if (event instanceof AuthImpersonationRevoked) {
          return this.persistImpersonationRevoked(event);
        }

        if (event instanceof AuthOpenIdRequestCompleted) {
          return this.persistAuthOpenIdRequestCompleted(event);
        }

        return assertNever(event);
      }),
    );
  }

  private persistUserAuthenticated(event: AuthUserAuthenticated) {
    const expiresAt = new Date(event.session.startedAt.getTime() + event.session.durationMs);

    return this.prisma.authSession.create({
      data: {
        expiresAt,
        sessionId: event.session.id,
        createdAt: event.session.startedAt,
        user: { connect: { id: event.id } },
      },
    });
  }

  private persistUserRegistered(event: AuthUserRegistered) {
    return this.prisma.user.create({
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
    return this.prisma.authImpersonation.create({
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
    return this.prisma.authImpersonation.deleteMany({
      where: { id: impersonationId },
    });
  }

  private persistAuthUserUnAuthenticated({ sessionId }: AuthUserUnAuthenticated) {
    return this.prisma.authSession.delete({ where: { sessionId } });
  }

  private persistAuthOpenIdRequestCompleted(message: AuthOpenIdRequestCompleted) {
    return this.prisma.openIdRequest.delete({
      where: { primaryKey: { id: message.request.id, provider: message.request.provider } },
    });
  }
}
