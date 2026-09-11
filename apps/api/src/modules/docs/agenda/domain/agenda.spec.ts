import { faker } from '@faker-js/faker';

import { DocInvalidation } from '../../shared/domain/invalidation/official-report-invalidated.integration-event';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import {
  Agenda,
  AgendaFileBlockEdited,
  AgendaFileBlockReset,
  AgendaFilesUpdated,
  EmptyAgenda,
} from './agenda';
import { AgendaSnapshot } from './agenda-snapshot';

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
  } as const satisfies Parameters<(typeof Agenda)['create']>[0]);

  type AgendaWithSnapshotProps = Partial<Omit<Parameters<(typeof Agenda)['from']>[0], 'snapshot'>> & {
    snapshot?: Partial<Parameters<(typeof AgendaSnapshot)['from']>[0]>;
  };
  function makeAgenda(localProps: AgendaWithSnapshotProps = {}): Agenda {
    const { snapshot, ...agendaProps } = localProps;

    const id = makeId('AgendaId');
    return Agenda.from({
      id,
      sessionId: makeId('SessionId'),
      officialReportId: null,
      snapshot: AgendaSnapshot.from({
        agendaId: id,
        date: props.date,
        sessionMeetingDate: props.sessionMeetingDate,
        chairmanId: props.chairman.id,
        nominationFiles: [
          {
            id: 1n,
            isManuallyEdited: false,
            nominationFileId: props.nominationFiles[0].id,
            reporters: props.nominationFiles[0].reporters,
          },
        ],
        ...snapshot,
      }),

      ...agendaProps,
    });
  }

  it('should prevent creating an agenda without files', () => {
    const act = () =>
      Agenda.create({
        ...props,
        nominationFiles: [],
      });

    expect(act).toThrow(EmptyAgenda);
  });

  it('should allow updating an agenda file with an already reported file in the linked official report', () => {
    const officialReportId = makeId('OfficialReportId');
    const agenda = makeAgenda({ officialReportId });

    const act = () =>
      agenda.updateFiles({
        authorId: props.authorId,
        nominationFileIds: new Set(props.nominationFiles.map((nf) => nf.id)),
      });

    expect(act).not.toThrow();
  });

  it('should emit an edited event when editing a file block', () => {
    const agenda = makeAgenda();

    agenda.editFileBlock({ fileId: 42n, html: '<p>custom</p>', outdated: true });

    expect(agenda.messages).toEqual([new AgendaFileBlockEdited(agenda.id, 42n, '<p>custom</p>', true)]);
  });

  it('should emit a reset event when resetting a file block', () => {
    const agenda = makeAgenda();

    agenda.resetFileBlock({ fileId: 42n });

    expect(agenda.messages).toEqual([new AgendaFileBlockReset(agenda.id, 42n)]);
  });

  it('should not emit an event when metadata are unchanged', () => {
    const agenda = makeAgenda();

    agenda.updateMetadata({
      date: props.date,
      authorId: props.authorId,
      chairmanId: props.chairman.id,
      sessionMeetingDate: props.sessionMeetingDate,
    });

    expect(agenda.messages).toEqual([]);
  });

  it('should carry an AgendaDateUpdated invalidation when the agenda date changes', () => {
    const agenda = makeAgenda();
    const date = DateOnly.fromJson({ day: 3, month: 3, year: 2026 });

    const diff = agenda.updateMetadata({
      date,
      authorId: props.authorId,
      chairmanId: props.chairman.id,
      sessionMeetingDate: props.sessionMeetingDate,
    });

    expect(diff).toMatchObject({
      hasAny: true,
      officialReportInvalidations: [
        {
          type: 'AgendaDateUpdated',
          payload: {
            agendaId: agenda.id,
            currentDate: date.toJson(),
            previousDate: props.date.toJson(),
          },
        } satisfies DocInvalidation,
      ],
    });
  });

  it('should carry no invalidation when only the chairman changes', () => {
    const agenda = makeAgenda();

    const diff = agenda.updateMetadata({
      chairmanId: 'chairman-2',
      authorId: props.authorId,
      date: props.date,
      sessionMeetingDate: props.sessionMeetingDate,
    });

    expect(diff).toMatchObject({ hasAny: true, officialReportInvalidations: [] });
  });

  it('should not emit an event when the files set is unchanged', () => {
    const agenda = makeAgenda();

    agenda.updateFiles({
      authorId: props.authorId,
      nominationFileIds: new Set(props.nominationFiles.map(({ id }) => id)),
    });

    expect(agenda.messages).toEqual([]);
  });

  it('should emit the added and removed files when the files set changes', () => {
    const agenda = makeAgenda();

    agenda.updateFiles({
      authorId: props.authorId,
      nominationFileIds: new Set(['nf-2']),
    });

    expect(agenda.messages).toEqual([
      new AgendaFilesUpdated(
        agenda.id,
        makeId('AuthorId', props.authorId),
        agenda.sessionId,
        expect.objectContaining({
          added: ['nf-2'],
          removed: ['nf-1'],
        }),
      ),
    ]);
  });
});
