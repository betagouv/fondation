import { makeId } from '../../../../utils/id';

import {
  OfficialReport,
  OfficialReportAlreadyValidated,
  OfficialReportDocumentNotStored,
  OfficialReportDraftChangedByTheApplication,
  OfficialReportDraftDiscarded,
  OfficialReportDraftEdited,
  OfficialReportDraftOpened,
  OfficialReportDraftUpdatedBySystem,
  OfficialReportFileNoteDeleted,
  OfficialReportFileNoteEdited,
  OfficialReportFileNoteReset,
  OfficialReportFileNotHeld,
  OfficialReportFileReset,
  OfficialReportIntroEdited,
  OfficialReportUpdateSkipped,
  OfficialReportValidated,
  OfficialReportWithoutValidatedVersion,
} from './official-report';
import { OfficialReportMembersList } from './official-report-member-list';
import * as helpers from './official-report-test-utils';
import type { UpdateOfficialReportCommand } from './official-report-types';
import {
  OfficialReportSnapshot,
  type PlainOfficialReportSnapshot,
} from './snapshot/official-report-snapshot';
import {
  OfficialReportSnapshotFile,
  type PlainOfficialReportSnapshotFile,
} from './snapshot/official-report-snapshot-file';

const AUTHOR = 'author-1';
const VALIDATED_AT = new Date('2026-06-08T09:00:00.000Z');

function makeReport(
  state: {
    actorId?: string | null;
    isDocumentStored?: boolean;
    isValidated?: boolean;
    snapshot?: Partial<PlainOfficialReportSnapshot>;
  } = {},
): OfficialReport {
  return OfficialReport.from({
    actorId: state.actorId === undefined ? AUTHOR : state.actorId,
    id: makeId('OfficialReportId'),
    isDocumentStored: state.isDocumentStored ?? true,
    isValidated: state.isValidated ?? false,
    snapshot: OfficialReportSnapshot.from(helpers.makeSnapshot(state.snapshot)),
  });
}

/** the form sent back as the report already knows it, files included since they come from the agenda */
function sameMetadataOf(report: OfficialReport): UpdateOfficialReportCommand['officialReport'] {
  const { meta } = report.snapshot;

  return {
    agenda: meta.agenda,
    chairman: meta.chairman,
    files: [
      {
        nominationFileId: 'file-1',
        outcome: { comment: null, value: 'VALIDATED' },
        recusedMembers: [],
        reporters: ['M. John DOE'],
      },
    ],
    hasRenunciation: meta.hasRenunciation,
    justiceDepartmentContactId: meta.justiceDepartmentContactId,
    members: meta.members,
    secretary: meta.secretary,
    sessionMeeting: meta.sessionMeeting,
  };
}

describe('OfficialReport', () => {
  it('records nothing as long as it is not validated', () => {
    expect(makeReport().messages).toEqual([]);
  });

  it('is validated at the given moment', () => {
    const report = makeReport();

    report.validate({ at: VALIDATED_AT, authorId: AUTHOR });

    expect(report.messages).toEqual([
      new OfficialReportValidated(report.id, VALIDATED_AT, makeId('AuthorId', AUTHOR)),
    ]);
  });

  it('refuses to be validated while its document is not stored', () => {
    const report = makeReport({ isDocumentStored: false });

    expect(() => report.validate({ at: VALIDATED_AT, authorId: AUTHOR })).toThrow(
      OfficialReportDocumentNotStored,
    );
    expect(report.messages).toEqual([]);
  });

  it('refuses to be validated twice', () => {
    const report = makeReport({ isValidated: true });

    expect(() => report.validate({ at: VALIDATED_AT, authorId: AUTHOR })).toThrow(
      OfficialReportAlreadyValidated,
    );
    expect(report.messages).toEqual([]);
  });

  describe('a draft report', () => {
    it('should record the person who edits it', () => {
      const report = makeReport({ actorId: AUTHOR });

      report.editIntro({ html: '<p>edited</p>', outdated: false });

      expect(report.messages).toContainEqual(new OfficialReportDraftEdited(report.id, AUTHOR));
    });

    it('should tell the application updated it on its own', () => {
      const report = makeReport({ actorId: null });

      report.invalidate({
        id: report.id,
        payload: {
          currentDate: { day: 21, month: 2, year: 2026 },
          previousDate: null,
          sessionId: 'session-1',
        },
        type: 'SessionDateUpdated',
      });

      expect(report.messages).toContainEqual(
        new OfficialReportDraftUpdatedBySystem(report.id, 'SESSION_DATE'),
      );

      expect(report.messages.some((m) => m instanceof OfficialReportDraftEdited)).toBe(false);
    });
  });

  describe('when the agenda rewrites a proposition', () => {
    const agendaFileBlockEdited = (report: OfficialReport, nominationFileId: string) =>
      report.invalidate({
        id: report.id,
        payload: { nominationFileId },
        type: 'AgendaFileBlockEdited',
      });

    it('should take the agenda sentence without asking', () => {
      const report = makeReport({ actorId: null });

      agendaFileBlockEdited(report, 'file-1');

      expect(report.messages).toEqual([
        new OfficialReportDraftUpdatedBySystem(report.id, 'AGENDA_TEXT'),
        new OfficialReportFileReset(report.id, 'file-1'),
      ]);
    });

    it('should leave a validated report as it is and only say so', () => {
      const report = makeReport({ actorId: null, isValidated: true });

      agendaFileBlockEdited(report, 'file-1');

      expect(report.messages).toEqual([new OfficialReportUpdateSkipped(report.id, 'AGENDA_TEXT')]);
    });

    it('should ignore a proposition it does not carry', () => {
      const report = makeReport({ actorId: null });

      agendaFileBlockEdited(report, 'file-unknown');

      expect(report.messages).toEqual([]);
    });
  });

  describe('a note under a proposition', () => {
    const withFile = (
      state: { actorId?: string | null; isValidated?: boolean },
      file: Pick<PlainOfficialReportSnapshotFile, 'note' | 'recusedMembers'>,
    ) =>
      makeReport({
        ...state,
        snapshot: {
          files: new Map([
            [
              'file-1',
              OfficialReportSnapshotFile.from({
                ...file,
                hasManuallyEditedHtml: false,
                nominationFileId: 'file-1',
                outcome: { comment: null, value: 'VALIDATED' },
                reporters: ['M. John DOE'],
              }),
            ],
          ]),
        },
      });
    const withNote = (state: { isValidated?: boolean } = {}) =>
      withFile(state, {
        note: { html: '<p>note</p>', outdated: false, status: 'EDITED' },
        recusedMembers: [],
      });
    const withRecusal = (state: { actorId?: string | null; isValidated?: boolean } = {}) =>
      withFile(state, {
        note: { html: null, outdated: false, status: 'GENERATED' },
        recusedMembers: [{ id: 'member-forget', name: 'M. Paul FORGET' }],
      });

    it('should be written by the person who edits the report', () => {
      const report = makeReport({ isValidated: true });

      report.editFileNote({ authorId: AUTHOR, html: '<p>note</p>', nominationFileId: 'file-1' });

      expect(report.messages).toEqual([
        new OfficialReportDraftOpened(report.id, AUTHOR),
        new OfficialReportFileNoteEdited(report.id, 'file-1', '<p>note</p>', AUTHOR),
      ]);
    });

    it('should leave a validated report as it is when the same note is written again', () => {
      const report = withNote({ isValidated: true });

      report.editFileNote({ authorId: AUTHOR, html: '<p>note</p>', nominationFileId: 'file-1' });

      expect(report.messages).toEqual([]);
    });

    it('should be deleted', () => {
      const report = withNote();

      report.deleteFileNote({ nominationFileId: 'file-1' });

      expect(report.messages).toEqual([
        new OfficialReportDraftEdited(report.id, AUTHOR),
        new OfficialReportFileNoteDeleted(report.id, 'file-1', 'GENERATED'),
      ]);
    });

    it('should remove the recusal mention from the report only', () => {
      const report = withRecusal();

      report.deleteFileNote({ nominationFileId: 'file-1' });

      expect(report.messages).toEqual([
        new OfficialReportDraftEdited(report.id, AUTHOR),
        new OfficialReportFileNoteDeleted(report.id, 'file-1', 'REMOVED'),
      ]);
    });

    it('should give the slot back to the recusal sentence', () => {
      const report = withNote();

      report.resetFileNote({ nominationFileId: 'file-1' });

      expect(report.messages).toEqual([
        new OfficialReportDraftEdited(report.id, AUTHOR),
        new OfficialReportFileNoteReset(report.id, 'file-1'),
      ]);
    });

    it('should leave a slot that already follows the recusal as it is', () => {
      const report = withRecusal({ isValidated: true });

      report.resetFileNote({ nominationFileId: 'file-1' });

      expect(report.messages).toEqual([]);
    });

    it('should keep the recusal it reports once validated and only say it changed', () => {
      const report = withRecusal({ actorId: null, isValidated: true });

      report.invalidate({
        id: report.id,
        payload: { files: [{ nominationFileId: 'file-1', recusedMembers: [] }] },
        type: 'NominationFilesRecusalsUpdated',
      });

      expect(report.messages).toEqual([new OfficialReportUpdateSkipped(report.id, 'RECUSAL')]);
    });

    it('should leave a validated report as it is when there is no note to delete', () => {
      const report = makeReport({ isValidated: true });

      report.deleteFileNote({ nominationFileId: 'file-1' });

      expect(report.messages).toEqual([]);
    });

    it('should refuse a proposition the report does not carry', () => {
      const report = makeReport();

      expect(() =>
        report.editFileNote({ authorId: AUTHOR, html: '<p>note</p>', nominationFileId: 'file-unknown' }),
      ).toThrow(OfficialReportFileNotHeld);
      expect(() => report.deleteFileNote({ nominationFileId: 'file-unknown' })).toThrow(
        OfficialReportFileNotHeld,
      );
      expect(report.messages).toEqual([]);
    });
  });

  describe('a validated report', () => {
    const validated = () => makeReport({ isValidated: true });

    it('should fork a draft before writing anything', () => {
      const report = validated();

      report.editIntro({ html: '<p>edited</p>', outdated: false });

      expect(report.messages).toEqual([
        new OfficialReportDraftOpened(report.id, AUTHOR),
        new OfficialReportIntroEdited(report.id, '<p>edited</p>', false),
      ]);
    });

    it('should fork a single draft whatever the number of changes', () => {
      const report = validated();

      report.editIntro({ html: '<p>first</p>', outdated: false });
      report.editConclusion({ html: '<p>second</p>', outdated: false });
      report.resetFile({ nominationFileId: 'nf-1' });

      expect(report.messages.filter((m) => m instanceof OfficialReportDraftOpened)).toHaveLength(1);
    });

    it('should keep the session date it reports and only say it changed', () => {
      const report = makeReport({ actorId: null, isValidated: true });

      report.invalidate({
        id: report.id,
        payload: {
          currentDate: { day: 21, month: 2, year: 2026 },
          previousDate: null,
          sessionId: 'session-1',
        },
        type: 'SessionDateUpdated',
      });

      expect(report.messages).toEqual([new OfficialReportUpdateSkipped(report.id, 'SESSION_DATE')]);
    });

    it('should keep a suspension decided since then and only say so', () => {
      const report = makeReport({
        actorId: null,
        isValidated: true,
        snapshot: {
          files: new Map([
            [
              'file-1',
              OfficialReportSnapshotFile.from({
                hasManuallyEditedHtml: false,
                nominationFileId: 'file-1',
                note: { html: null, outdated: false, status: 'GENERATED' },
                outcome: { comment: null, value: 'SUSPENDED' },
                recusedMembers: [],
                reporters: ['M. John DOE'],
              }),
            ],
          ]),
        },
      });

      report.invalidate({
        id: report.id,
        payload: {
          files: [{ nominationFileId: 'file-1', outcome: { comment: null, value: 'VALIDATED' } }],
        },
        type: 'NominationFilesOutcomeUpdated',
      });

      expect(report.messages).toEqual([new OfficialReportUpdateSkipped(report.id, 'OUTCOME')]);
    });

    it('should have nothing to discard', () => {
      const report = validated();

      report.discardDraft({ changesBy: 'PERSON', hasValidatedVersion: true });

      expect(report.messages).toEqual([]);
    });

    it('should stay as it is when its metadata are saved unchanged', () => {
      const report = validated();

      report.update({ authorId: AUTHOR, officialReport: sameMetadataOf(report) });

      expect(report.messages).toEqual([]);
    });

    it('should fork a draft when a metadata changes', () => {
      const report = validated();
      const metadata = sameMetadataOf(report);

      report.update({
        authorId: AUTHOR,
        officialReport: { ...metadata, hasRenunciation: !metadata.hasRenunciation },
      });

      expect(report.messages[0]).toEqual(new OfficialReportDraftOpened(report.id, AUTHOR));
    });
  });

  describe('a draft report', () => {
    it('should not record a save that changes nothing', () => {
      const report = makeReport();

      report.update({ authorId: AUTHOR, officialReport: sameMetadataOf(report) });

      expect(report.messages).toEqual([]);
    });

    it('should keep a recorded member who is no longer offered, with the recorded absence', () => {
      const report = makeReport();
      const metadata = sameMetadataOf(report);
      const offered = metadata.members.toSortedArray().filter(({ id }) => id !== 'member-2');

      report.update({
        authorId: AUTHOR,
        officialReport: { ...metadata, members: OfficialReportMembersList.from(offered) },
      });

      expect(report.messages).toEqual([]);
    });

    it('should not fork another draft', () => {
      const report = makeReport();

      report.editIntro({ html: '<p>edited</p>', outdated: false });

      expect(report.messages).toEqual([
        new OfficialReportDraftEdited(report.id, AUTHOR),
        new OfficialReportIntroEdited(report.id, '<p>edited</p>', false),
      ]);
    });

    it('should be discarded when a validated version remains underneath', () => {
      const report = makeReport();

      report.discardDraft({ changesBy: 'PERSON', hasValidatedVersion: true });

      expect(report.messages).toEqual([new OfficialReportDraftDiscarded(report.id)]);
    });

    it('should refuse to be discarded when nothing was ever validated', () => {
      const report = makeReport();

      expect(() => report.discardDraft({ changesBy: 'PERSON', hasValidatedVersion: false })).toThrow(
        OfficialReportWithoutValidatedVersion,
      );
      expect(report.messages).toEqual([]);
    });

    it.each(['SYSTEM', 'PERSON_AND_SYSTEM'] as const)(
      'should refuse to be discarded when the application changed it (%s)',
      (changesBy) => {
        const report = makeReport();

        expect(() => report.discardDraft({ changesBy, hasValidatedVersion: true })).toThrow(
          OfficialReportDraftChangedByTheApplication,
        );
        expect(report.messages).toEqual([]);
      },
    );
  });
});
