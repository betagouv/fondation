import * as crypto from 'node:crypto';

import { faker } from '@faker-js/faker/locale/fr';

import { USER_DUTIES, USER_TITLES } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import { OfficialReportAgenda } from './official-report-agenda';
import { OfficialReportChairman } from './official-report-chairman';
import { OfficialReportMember } from './official-report-member';
import { OfficialReportMembersList } from './official-report-member-list';
import { OfficialReportSecretary } from './official-report-secretary';
import { OfficialReportSessionMeeting } from './official-report-session-meeting';
import type { PlainOfficialReportSnapshot } from './snapshot/official-report-snapshot';
import { OfficialReportSnapshotFile } from './snapshot/official-report-snapshot-file';

export function makeSecretary(
  props: Partial<Parameters<(typeof OfficialReportSecretary)['from']>[0]> = {},
): Parameters<(typeof OfficialReportSecretary)['from']>[0] {
  return {
    id: crypto.randomUUID(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    gender: faker.helpers.enumValue(GenderEnum),
    displayTitle: null,
    role: 'ADJOINT_SECRETAIRE_GENERAL',
    duty: 'SECRETARY',
    title: faker.helpers.arrayElement(['FIRST_SECRETARY', null]),

    ...props,
  } satisfies Parameters<(typeof OfficialReportSecretary)['from']>[0];
}

export function makeMember(
  props: Partial<Parameters<(typeof OfficialReportMember)['from']>[0]> = {},
): Parameters<(typeof OfficialReportMember)['from']>[0] {
  return {
    id: crypto.randomUUID(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    gender: faker.helpers.enumValue(GenderEnum),
    sort: crypto.randomInt(1, 10_000),
    role: 'MEMBRE_COMMUN',
    displayTitle: null,
    isAbsent: false,
    expectedFormation: 'PARQUET',
    title: faker.helpers.arrayElement([...USER_TITLES.filter((x) => x !== 'FIRST_SECRETARY'), null]),
    duty: faker.helpers.arrayElement([
      ...USER_DUTIES.filter((x) => x !== 'OFFICER' && x !== 'SECRETARY'),
      null,
    ]),

    ...props,
  } satisfies Parameters<(typeof OfficialReportMember)['from']>[0];
}

export function makeChairman(
  props: Partial<Parameters<(typeof OfficialReportChairman)['from']>[0]> = {},
): Parameters<(typeof OfficialReportChairman)['from']>[0] {
  return {
    id: crypto.randomUUID(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    gender: faker.helpers.enumValue(GenderEnum),
    sort: crypto.randomInt(1, 10_000),
    role: 'MEMBRE_COMMUN',
    displayTitle: null,
    expectedFormation: 'PARQUET',
    title: faker.helpers.arrayElement([...USER_TITLES.filter((x) => x !== 'FIRST_SECRETARY'), null]),
    duty: faker.helpers.arrayElement([
      ...USER_DUTIES.filter((x) => x !== 'OFFICER' && x !== 'SECRETARY'),
      null,
    ]),

    ...props,
  } satisfies Parameters<(typeof OfficialReportChairman)['from']>[0];
}

export function makeSnapshot(props: Partial<PlainOfficialReportSnapshot> = {}): PlainOfficialReportSnapshot {
  return {
    agenda: OfficialReportAgenda.from({
      ignoreOfficialReportId: makeId('OfficialReportId', 'or-1'),
      agenda: {
        id: 'agenda-1',
        formation: 'PARQUET',
        officialReportId: null,
        date: new DateOnly(2026, 3, 1),
        session: { id: 'session-1', date: new DateOnly(2026, 2, 20) },
      },
    }),
    secretary: OfficialReportSecretary.from(makeSecretary()),
    chairman: OfficialReportChairman.from(makeChairman()),
    sessionMeeting: OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ day: 10, month: 4, year: 2026 }),
      endTime: { hours: 18, minutes: 10, seconds: 0 },
      startTime: { hours: 18, minutes: 0, seconds: 0 },
    }),

    hasRenunciation: true,
    justiceDepartmentContactId: 1000n,

    members: OfficialReportMembersList.from(
      [0, 1, 2].map((id) => OfficialReportMember.from(makeMember({ id: `member-${id}` }))),
    ),

    files: new Map([
      [
        'file-1',
        OfficialReportSnapshotFile.from({
          id: 0n,
          nominationFileId: 'file-1',
          hasManuallyEditedHtml: false,
          reporters: ['M. John DOE'],
          outcome: { value: 'VALIDATED', comment: null },
        }),
      ],
    ]),

    manuallyEditedPart: { conclusion: false, intro: false },

    ...props,
  };
}
