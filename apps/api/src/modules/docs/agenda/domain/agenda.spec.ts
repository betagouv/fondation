import { faker } from '@faker-js/faker';

import { DocInvalidation } from '../../shared/domain/invalidation/official-report-invalidated.integration-event';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import {
  Agenda,
  AgendaAlreadyValidated,
  AgendaDocumentNotStored,
  AgendaDraftDiscarded,
  AgendaDraftEdited,
  AgendaDraftOpened,
  AgendaDraftUpdatedBySystem,
  AgendaFileBlockEdited,
  AgendaFileBlockReset,
  UnknownAgendaFileBlock,
  AgendaFilesAlreadyReported,
  AgendaFilesUpdated,
  AgendaValidated,
  AgendaWithoutValidatedVersion,
  EmptyAgenda,
} from './agenda';
import { AgendaSnapshot } from './agenda-snapshot';

const AUTHOR = 'author-1';
const NO_PRESENTED_FILE: ReadonlySet<string> = new Set();

function presentedFiles(...nominationFileIds: string[]): ReadonlySet<string> {
  return new Set(nominationFileIds);
}

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
    reportedNominationFileIds: NO_PRESENTED_FILE,
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

      actorId: AUTHOR,
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

  it('should prevent creating an agenda with a file already presented', () => {
    const act = () =>
      Agenda.create({
        ...props,
        reportedNominationFileIds: presentedFiles(props.nominationFiles[0].id),
      });

    expect(act).toThrow(AgendaFilesAlreadyReported);
  });

  it('should prevent adding a file already presented', () => {
    const agenda = makeAgenda();

    const act = () =>
      agenda.updateFiles({
        authorId: props.authorId,
        nominationFileIds: new Set([...props.nominationFiles.map((nf) => nf.id), 'nf-2']),
        reportedNominationFileIds: presentedFiles('nf-2'),
      });

    expect(act).toThrow(AgendaFilesAlreadyReported);
  });

  it('should allow keeping a file of the agenda that became presented', () => {
    const agenda = makeAgenda();

    const act = () =>
      agenda.updateFiles({
        authorId: props.authorId,
        nominationFileIds: new Set([...props.nominationFiles.map((nf) => nf.id), 'nf-2']),
        reportedNominationFileIds: presentedFiles(props.nominationFiles[0].id),
      });

    expect(act).not.toThrow();
  });

  it('should allow removing a file that became presented', () => {
    const agenda = makeAgenda();

    const act = () =>
      agenda.updateFiles({
        authorId: props.authorId,
        nominationFileIds: new Set(['nf-2']),
        reportedNominationFileIds: presentedFiles(props.nominationFiles[0].id),
      });

    expect(act).not.toThrow();
  });

  it('should emit an edited event when editing a file block', () => {
    const agenda = makeAgenda();

    agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>custom</p>', outdated: true });

    expect(agenda.messages).toContainEqual(
      new AgendaFileBlockEdited(agenda.id, 'nf-1', '<p>custom</p>', true, AUTHOR),
    );
  });

  it('should emit a reset event when resetting a file block', () => {
    const agenda = makeAgenda();

    agenda.resetFileBlock({ fileId: 1n });

    expect(agenda.messages).toContainEqual(new AgendaFileBlockReset(agenda.id, 'nf-1'));
  });

  it('should refuse a block the agenda does not carry', () => {
    const agenda = makeAgenda();

    expect(() =>
      agenda.editFileBlock({ authorId: AUTHOR, fileId: 42n, html: '<p>custom</p>', outdated: true }),
    ).toThrow(UnknownAgendaFileBlock);
    expect(agenda.messages).toEqual([]);
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
      reportedNominationFileIds: NO_PRESENTED_FILE,
    });

    expect(agenda.messages).toEqual([]);
  });

  it('should emit the added and removed files when the files set changes', () => {
    const agenda = makeAgenda();

    agenda.updateFiles({
      authorId: props.authorId,
      nominationFileIds: new Set(['nf-2']),
      reportedNominationFileIds: NO_PRESENTED_FILE,
    });

    expect(agenda.messages).toContainEqual(
      new AgendaFilesUpdated(
        agenda.id,
        makeId('AuthorId', props.authorId),
        agenda.sessionId,
        expect.objectContaining({
          added: ['nf-2'],
          removed: ['nf-1'],
        }),
      ),
    );
  });

  describe('a validated agenda', () => {
    const validated = () => makeAgenda({ isValidated: true });

    it('should open a draft before the first change', () => {
      const agenda = validated();

      agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>edited</p>', outdated: false });

      expect(agenda.messages).toEqual([
        new AgendaDraftOpened(agenda.id, AUTHOR),
        new AgendaFileBlockEdited(agenda.id, 'nf-1', '<p>edited</p>', false, AUTHOR),
      ]);
    });

    it('should open a single draft whatever the number of changes', () => {
      const agenda = validated();

      agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>edited</p>', outdated: false });
      agenda.resetFileBlock({ fileId: 1n });

      expect(agenda.messages.filter((message) => message instanceof AgendaDraftOpened)).toHaveLength(1);
    });

    it('should not open a draft when nothing changes', () => {
      const agenda = validated();

      agenda.updateMetadata({
        authorId: props.authorId,
        chairmanId: props.chairman.id,
        date: props.date,
        sessionMeetingDate: props.sessionMeetingDate,
      });

      expect(agenda.messages).toEqual([]);
    });

    it('should refuse to be validated again', () => {
      const agenda = validated();

      const act = () => agenda.validate({ at: new Date(), authorId: props.authorId });

      expect(act).toThrow(AgendaAlreadyValidated);
    });

    it('should open a new draft after being validated again', () => {
      const agenda = makeAgenda({ isDocumentStored: true });

      agenda.validate({ at: new Date(), authorId: props.authorId });
      agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>edited</p>', outdated: false });

      expect(agenda.messages.filter((message) => message instanceof AgendaDraftOpened)).toHaveLength(1);
    });
  });

  describe('a draft agenda', () => {
    it('should record the person who edits it', () => {
      const agenda = makeAgenda({ actorId: AUTHOR });

      agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>edited</p>', outdated: false });

      expect(agenda.messages).toContainEqual(new AgendaDraftEdited(agenda.id, AUTHOR));
    });

    it('should tell the application updated it on its own', () => {
      const agenda = makeAgenda({ actorId: null });

      agenda.updateFilesReporters({
        nominationFiles: [{ id: props.nominationFiles[0].id, reporters: ['Mme DURAND Lucie'] }],
      });

      expect(agenda.messages).toContainEqual(new AgendaDraftUpdatedBySystem(agenda.id, 'REPORTERS'));

      expect(agenda.messages.some((message) => message instanceof AgendaDraftEdited)).toBe(false);
    });

    it('should not open another draft', () => {
      const agenda = makeAgenda();

      agenda.editFileBlock({ authorId: AUTHOR, fileId: 1n, html: '<p>edited</p>', outdated: false });

      expect(agenda.messages).toEqual([
        new AgendaDraftEdited(agenda.id, AUTHOR),
        new AgendaFileBlockEdited(agenda.id, 'nf-1', '<p>edited</p>', false, AUTHOR),
      ]);
    });

    it('should be validated', () => {
      const agenda = makeAgenda({ isDocumentStored: true });
      const at = new Date();

      agenda.validate({ at, authorId: props.authorId });

      expect(agenda.messages).toEqual([
        new AgendaValidated(agenda.id, at, makeId('AuthorId', props.authorId)),
      ]);
    });

    it('should refuse to be validated while its document is not stored', () => {
      const agenda = makeAgenda();

      const act = () => agenda.validate({ at: new Date(), authorId: props.authorId });

      expect(act).toThrow(AgendaDocumentNotStored);
      expect(agenda.messages).toEqual([]);
    });

    it('should be discarded when a validated version remains underneath', () => {
      const agenda = makeAgenda();

      agenda.discardDraft({ hasValidatedVersion: true });

      expect(agenda.messages).toEqual([new AgendaDraftDiscarded(agenda.id)]);
    });

    it('should refuse to be discarded without a validated version to fall back on', () => {
      const agenda = makeAgenda();

      const act = () => agenda.discardDraft({ hasValidatedVersion: false });

      expect(act).toThrow(AgendaWithoutValidatedVersion);
    });
  });
});
