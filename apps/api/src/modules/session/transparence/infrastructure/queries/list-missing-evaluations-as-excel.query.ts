import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { Db } from 'src/modules/framework/database';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { capitalize } from 'src/utils/capitalize';

const COLUMNS = [
  { label: 'N°', width: 10 },
  { label: 'Magistrat', width: 25 },
  { label: 'Grade actuel', width: 10 },
  { label: 'Poste actuel', width: 70 },
  { label: 'Grade cible', width: 10 },
  { label: 'Poste cible', width: 70 },
  { label: 'Rapporteur(s)', width: 30 },
  { label: 'Commentaire', width: 40 },
];

@Injectable()
export class ListMissingEvaluationsAsExcelQuery {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<StreamableFile> {
    const session = await this.db.withTransaction(async () => {
      const version = await this.versions.last({ sessionId: query.sessionId });

      return this.db.tx.session.findUnique({
        where: { id: query.sessionId, deletedAt: null },
        select: {
          dossierDeNominations: {
            where: { missingEvaluation: true },
            orderBy: { number: 'asc' },
            select: {
              name: true,
              number: true,
              grade: true,
              currentPosition: true,
              targetedGrade: true,
              targetedPosition: true,
              missingEvaluationComment: true,

              reporterIds: {
                where: { versionId: version.optionalId },
                select: { user: { select: { firstName: true, lastName: true } } },
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
      nf.grade || '',
      nf.currentPosition || '',
      nf.targetedGrade || '',
      nf.targetedPosition || '',
      nf.reporterIds
        .map(({ user }) => `${user.lastName.toUpperCase()} ${capitalize(user.firstName)}`)
        .join(', '),
      nf.missingEvaluationComment || '',
    ]);

    const sessionData = [COLUMNS.map(({ label }) => label), ...rows];

    const xlsx = build([
      {
        data: sessionData,
        name: 'Évaluations manquantes',
        options: {
          '!cols': COLUMNS.map(({ width }) => ({ wch: width })),
        },
      },
    ]);

    return new StreamableFile(Buffer.from(xlsx), {
      type: FILE_MIME_TYPES.xlsx,
      disposition: `inline; filename="${encodeURIComponent(`evaluations-manquantes-${new Date().toISOString().split('T')[0]}.xlsx`)}"`,
    });
  }
}
