import { forwardRef, Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import { Prisma } from '../../../../../generated/prisma/client';
import { capitalize } from '../../../../../utils/capitalize';
import { Db } from '../../../../framework/database';
import { contentDisposition, FILE_MIME_TYPES } from '../../../../framework/files';
import { proposedMagistratName } from '../../../../magistrat/domain/magistrat-name';
import { ObservationService } from '../../../../observation/observation.service';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { PriorityEnumLabels } from '../../../../shared/mappers/priorite.mapper';
import { nominationFileOutcomeLabel } from '../../../../shared/nomination-file-outcome.enum';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class ListNominationFilesAsExcelQuery {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  async handle(query: { sessionId: string }): Promise<StreamableFile> {
    const [session, observants] = await this.db.withTransaction(async () => {
      const version = await this.versions.last({
        sessionId: query.sessionId,
      });

      const txSession = await this.db.tx.session.findUnique({
        where: { id: query.sessionId, deletedAt: null },
        select: {
          formation: true,
          dossierDeNominations: {
            orderBy: { number: 'asc' },
            select: {
              detectedMagistrat: { select: { firstName: true, lastName: true, marriedName: true } },
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
        } satisfies Prisma.SessionSelect,
      });
      const txObservants = await this.observations.internalFindNominationFilesObservants({
        nominationFileIds: new Set(txSession?.dossierDeNominations.map(({ id }) => id)),
      });

      return [txSession, txObservants] as const;
    });

    if (!session) {
      throw new NotFoundException();
    }

    const rows = session.dossierDeNominations.map((nf) => [
      nf.number !== null ? String(nf.number) : '',
      proposedMagistratName(nf),
      nf.currentPosition || '',
      nf.grade || '',
      nf.targetedPosition || '',
      nf.targetedGrade || '',
      nf.reporterIds
        .map(({ user }) => `${user.lastName.toUpperCase()} ${capitalize(user.firstName)}`)
        .join(', '),
      (observants.get(nf.id) ?? [])
        .map(({ name }) => name)
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
      disposition: contentDisposition({
        download: true,
        name: `dossiers-nomination-${new Date().toISOString().split('T')[0]}.xlsx`,
      }),
    });
  }
}
