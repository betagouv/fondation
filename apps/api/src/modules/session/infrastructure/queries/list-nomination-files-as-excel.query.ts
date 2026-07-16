import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import { nominationFileOutcomeLabel } from '../../domain/nomination-file-outcome';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { PrismaService } from 'src/modules/framework/database';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { PriorityEnumLabels } from 'src/modules/shared/mappers/priorite.mapper';
import { capitalize } from 'src/utils/capitalize';

@Injectable()
export class ListNominationFilesAsExcelQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<StreamableFile> {
    const session = await this.prisma.$transaction(async (tx) => {
      const version = await this.versions.last({
        sessionId: query.sessionId,
        tx,
      });

      return tx.session.findUnique({
        where: { id: query.sessionId, deletedAt: null },
        select: {
          formation: true,
          dossierDeNominations: {
            orderBy: { number: 'asc' },
            select: {
              id: true,
              name: true,
              number: true,
              currentPosition: true,
              grade: true,
              targetedGrade: true,
              targetedPosition: true,
              priorities: true,

              outcome: true,
              outcomeComment: true,

              observers: true,
              observations: {
                select: {
                  magistrat: {
                    select: { firstName: true, usedName: true, lastName: true },
                  },
                },
              },

              reporterIds: {
                where: { versionId: version.optionalId },
                select: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (!session) {
      throw new NotFoundException();
    }

    const rows = session.dossierDeNominations.map((nf) => [
      nf.number !== null ? String(nf.number) : '',
      nf.name || '',
      nf.currentPosition || '',
      nf.grade || '',
      nf.targetedPosition || '',
      nf.targetedGrade || '',
      nf.reporterIds
        .map(({ user }) => `${user.lastName.toUpperCase()} ${capitalize(user.firstName)}`)
        .join(', '),
      nf.observations
        .map(({ magistrat }) =>
          [
            capitalize(magistrat.firstName),
            magistrat.usedName && magistrat.usedName !== magistrat.lastName
              ? magistrat.usedName.toUpperCase()
              : magistrat.lastName.toUpperCase(),
          ].join(' '),
        )
        .concat(nf.observers || [])
        .join(','),
      nf.priorities.map((x) => PriorityEnumLabels[x]).join(', '),
      nf.outcome
        ? capitalize(
            nominationFileOutcomeLabel({
              outcome: nf.outcome,
              formation: prismaFormationEnumToFormationEnum(session.formation),
            }),
          )
        : '',
      nf.outcome && nf.outcomeComment ? nf.outcomeComment : '',
    ]);

    const sessionData = [
      [
        'N°',
        'Magistrat',
        'Poste actuel',
        'Grade actuel',
        'Poste cible',
        'Grade cible',
        'Rapporteur(s)',
        'Observants',
        'Priorité',
        'Issue',
        'Commentaire issue',
      ],
      ...rows,
    ];

    const xlsx = build([
      {
        data: sessionData,
        name: 'Dossiers de nomination',
        options: {
          '!cols': [
            { wch: 10 }, // N°
            { wch: 25 }, // Magistrat
            { wch: 70 }, // Poste actuel
            { wch: 10 }, // Grade actuel
            { wch: 70 }, // Poste cible
            { wch: 10 }, // Grade cible
            { wch: 30 }, // Rapporteur(s)
            { wch: 70 }, // Observants
            { wch: 15 }, // Priorité
            { wch: 20 }, // Issue
            { wch: 30 }, // Commentaire Issue
          ],
        },
      },
    ]);

    return new StreamableFile(Buffer.from(xlsx), {
      type: FILE_MIME_TYPES.xlsx,
      disposition: `inline; filename="${encodeURIComponent(`dossiers-nomination-${new Date().toISOString().split('T')[0]}.xlsx`)}"`,
    });
  }
}
