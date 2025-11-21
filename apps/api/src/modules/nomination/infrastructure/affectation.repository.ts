import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import {
  Affectations,
  CandidateAffectationEvent,
} from 'src/modules/nomination/domain/affectation';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';

@Injectable()
export class AffectationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: DateTimeProvider,
  ) {}

  persist(sessionId: string, affectations: Affectations) {
    const messages = affectations.messages;
    messages.forEach(async (message) => {
      if (message instanceof CandidateAffectationEvent) {
        await this.persistCandidateAffectationEvent(sessionId, message);
      }
    });
  }

  async persistCandidateAffectationEvent(
    sessionId: string,
    message: CandidateAffectationEvent,
  ) {
    // TODO: quelque chose à faire avec le version finder?
    const lastAffectation = await this.prisma.affectationVersion.findFirst({
      where: {
        sessionId,
      },
    });

    if (lastAffectation) {
      this.prisma.affectationVersion.update({
        where: {
          sessionId_version: [sessionId, lastAffectation.version],
        },
      });
      return;
    }

    this.prisma.affectationVersion.create({
      data: {
        sessionId,
        datePublication: this.clock.now(),
        affectations: {
          createMany: {
            data: message.members.map((member) => ({
              version: 2,
              userId: member.id,
              nominationFileId: message.candidate.nominationSessionFileId,
            })),
          },
        },
        // TODO RECUPERER L'ID de l'utilisateur et migrer vers un id user
        auteurPublicationId: '',
      },
    });
  }
}
