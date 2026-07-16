import { faker } from '@faker-js/faker';

import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import { Agenda, AgendaFilesAlreadyReported, EmptyAgenda } from './agenda';
import { ReportedNominationFileCollection } from './reported-nomination-file-collection';

describe('Agenda', () => {
  const props = Object.freeze({
    authorId: 'author-1',
    chairman: {
      id: 'chairman-1',
      title: null,
      displayTitle: null,
      gender: GenderEnum.MALE,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    },
    date: DateOnly.fromJson({ day: 2, month: 2, year: 2026 }),
    nominationFiles: [
      {
        id: 'nf-1',
        number: 1,
        reporters: [],
        currentPosition: faker.lorem.sentence(10),
        grade: 'G3',
        name: faker.person.fullName(),
        outcome: { value: 'VALIDATED', comment: null },
        targetedGrade: 'G3',
        targetedPosition: faker.lorem.sentence(10),
      },
    ],
    sessionId: 'session-1',
    sessionMeetingDate: DateOnly.fromJson({ day: 10, month: 2, year: 2026 }),
    reportedFiles: ReportedNominationFileCollection.from([]),
  } as const satisfies Parameters<(typeof Agenda)['create']>[0]);

  it('should prevent creating an agenda without files', () => {
    const act = () =>
      Agenda.create({
        ...props,
        nominationFiles: [],
        reportedFiles: ReportedNominationFileCollection.from([]),
      });

    expect(act).toThrow(EmptyAgenda);
  });

  it('should prevent creating an agenda with files already reported', () => {
    const officialReportId = makeId('OfficialReportId');
    const act = () =>
      Agenda.create({
        ...props,
        reportedFiles: ReportedNominationFileCollection.from([
          { nominationFileId: props.nominationFiles[0].id, officialReportId, outcome: 'VALIDATED' },
        ]),
      });

    expect(act).toThrow(AgendaFilesAlreadyReported);
  });

  it('should prevent updating an agenda with an already reported file', () => {
    const agenda = Agenda.from({
      ...props,
      id: makeId('AgendaId'),
      sessionId: makeId('SessionId'),
      officialReportId: null,
    });

    const officialReportId = makeId('OfficialReportId');
    const act = () =>
      agenda.update({
        ...props,
        reportedFiles: ReportedNominationFileCollection.from([
          { nominationFileId: props.nominationFiles[0].id, officialReportId, outcome: 'VALIDATED' },
        ]),
      });

    expect(act).toThrow(new AgendaFilesAlreadyReported([props.nominationFiles[0].id]));
  });

  it('should allow updating an agenda with an already reported file in the linked official report', () => {
    const officialReportId = makeId('OfficialReportId');
    const agenda = Agenda.from({
      ...props,
      id: makeId('AgendaId'),
      sessionId: makeId('SessionId'),
      officialReportId,
    });

    const act = () =>
      agenda.update({
        ...props,
        reportedFiles: ReportedNominationFileCollection.from([
          { nominationFileId: props.nominationFiles[0].id, officialReportId, outcome: 'VALIDATED' },
        ]),
      });

    expect(act).not.toThrow();
  });
});
