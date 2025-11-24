import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import {
  AuthUser,
  AuthUserAuthenticated,
  AuthUserRegistered,
  AuthUserUnAuthenticated,
} from '../../domain/auth-user';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      select: { id: true, password: true },
      where: { email },
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

        return assertNever(event);
      }),
    );
  }

  private persistUserAuthenticated(event: AuthUserAuthenticated) {
    const expiresAt = new Date(
      event.session.startedAt.getTime() + event.session.durationMs,
    );

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

  private persistAuthUserUnAuthenticated({
    sessionId,
  }: AuthUserUnAuthenticated) {
    return this.prisma.authSession.delete({ where: { sessionId } });
  }
}
