import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import { PrismaService } from 'src/modules/framework/database';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { PrioriteEnumLabels } from 'src/modules/shared/mappers/priorite.mapper';
import { capitalize } from 'src/utils/capitalize';

import { nominationFileOutcomeLabel } from '../../domain/nomination-file-outcome';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

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
        where: { id: query.sessionId },
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
              targetedPosition: true,
              priorite: true,

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
                where: { versionId: version?.id },
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
      nf.observations
        .map(({ magistrat }) =>
          magistrat.usedName !== magistrat.lastName
            ? [
                magistrat.usedName.toUpperCase(),
                magistrat.lastName.toUpperCase(),
                capitalize(magistrat.firstName),
              ].join(' ')
            : [
                magistrat.lastName.toUpperCase(),
                capitalize(magistrat.firstName),
              ].join(' '),
        )
        .concat(nf.observers || [])
        .join(','),
      nf.priorite ? PrioriteEnumLabels[nf.priorite] : '',
      nf.outcome
        ? capitalize(
            nominationFileOutcomeLabel({
              outcome: nf.outcome,
              formation: prismaFormationEnumToFormationEnum(session.formation),
            }),
          )
        : '',
      nf.outcome && nf.outcomeComment ? nf.outcomeComment : '',
      nf.reporterIds
        .map(
          ({ user }) =>
            `${user.lastName.toUpperCase()} ${capitalize(user.firstName)}`,
        )
        .join(', '),
    ]);

    const sessionData = [
      [
        'N°',
        'Magistrat',
        'Poste actuel',
        'Grade actuel',
        'Poste cible',
        'Observants',
        'Priorité',
        'Issue',
        'Commentaire issue',
        'Rapporteur(s)',
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
            { wch: 30 }, // Poste actuel
            { wch: 20 }, // Grade actuel
            { wch: 30 }, // Poste cible
            { wch: 25 }, // Observants
            { wch: 15 }, // Priorité
            { wch: 20 }, // Issue
            { wch: 30 }, // Commentaire Issue
            { wch: 30 }, // Rapporteur(s)
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
