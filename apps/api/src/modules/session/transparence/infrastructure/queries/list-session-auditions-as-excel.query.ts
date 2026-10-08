import { Injectable, StreamableFile } from '@nestjs/common';
import { build } from 'node-xlsx';

import { SessionAuditionsFinder } from '../finders/session-auditions.finder';
import { Db } from 'src/modules/framework/database';
import { contentDisposition, FILE_MIME_TYPES } from 'src/modules/framework/files';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { capitalize } from 'src/utils/capitalize';
import type { DateOnlyJson } from 'src/utils/date-only';
import { formatPhoneNumber } from 'src/utils/format-phone-number';
import { timeOnlyToString } from 'src/utils/time-only';

import { sortByName } from './list-session-auditions.query';

const COLUMNS = [
  { label: 'Magistrat', width: 30 },
  { label: 'Poste actuel', width: 50 },
  { label: 'Qualité', width: 12 },
  { label: 'Proposition(s)', width: 70 },
  { label: 'Date', width: 12 },
  { label: 'Heure', width: 8 },
  { label: 'Rapporteur(s)', width: 30 },
  { label: 'Téléphone', width: 16 },
  { label: 'Étiquette', width: 16 },
  { label: 'Courriel', width: 35 },
];

const ROLE_LABELS = { OBSERVANT: 'Observant', PROPOSED: 'Proposé' } as const;

function frenchDate(date: DateOnlyJson): string {
  return [date.day, date.month]
    .map((part) => String(part).padStart(2, '0'))
    .concat(String(date.year))
    .join('/');
}

@Injectable()
export class ListSessionAuditionsAsExcelQuery {
  constructor(
    private readonly db: Db,
    private readonly sessionAuditions: SessionAuditionsFinder,
  ) {}

  async handle(query: { role: RoleEnum; sessionId: string }): Promise<StreamableFile> {
    const auditions = await this.db.withTransaction(() => this.sessionAuditions.find(query));

    const rows = auditions
      .sort(sortByName)
      .map((audition) => [
        audition.magistrat.name,
        audition.magistrat.currentPosition ?? '',
        ROLE_LABELS[audition.role],
        audition.propositions.map(({ label }) => label).join('\n'),
        audition.audition ? frenchDate(audition.audition.date) : 'À programmer',
        audition.audition ? timeOnlyToString(audition.audition.time) : '',
        audition.reporters
          .map(({ firstName, lastName }) => `${lastName.toUpperCase()} ${capitalize(firstName)}`)
          .join(', '),
        audition.contact?.phoneNumber ? formatPhoneNumber(audition.contact.phoneNumber.number) : '',
        audition.contact?.phoneNumber?.label ?? '',
        audition.contact?.email ?? '',
      ]);

    const xlsx = build([
      {
        data: [COLUMNS.map(({ label }) => label), ...rows],
        name: 'Auditions',
        options: { '!cols': COLUMNS.map(({ width }) => ({ wch: width })) },
      },
    ]);

    return new StreamableFile(Buffer.from(xlsx), {
      disposition: contentDisposition({ download: true, name: 'auditions.xlsx' }),
      type: FILE_MIME_TYPES.xlsx,
    });
  }
}
