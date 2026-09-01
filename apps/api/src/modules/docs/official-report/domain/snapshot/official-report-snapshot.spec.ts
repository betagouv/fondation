import { OfficialReportChairman } from '../official-report-chairman';
import { OfficialReportMember } from '../official-report-member';
import { OfficialReportMembersList } from '../official-report-member-list';
import { OfficialReportSecretary } from '../official-report-secretary';
import { OfficialReportSessionMeeting } from '../official-report-session-meeting';
import * as helpers from '../official-report-test-utils';
import { UpdateOfficialReportCommand } from '../official-report-types';
import { DateOnly } from 'src/utils/date-only';

import { OfficialReportSnapshot, PlainOfficialReportSnapshot } from './official-report-snapshot';
import { OfficialReportSnapshotFile, PlainOfficialReportSnapshotFile } from './official-report-snapshot-file';

describe('OfficialReportSnapshot', () => {
  it('should have no difference with the same snapshot', () => {
    const { snapshot, update } = makeSnapshot();

    const { diff } = snapshot.update(update);

    expect(diff.hasAny).toBe(false);
    expect(diff.intro).toBe('NOOP');
    expect(diff.conclusion).toBe('NOOP');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the chairman difference', () => {
    const { snapshot, update } = makeSnapshot({
      chairman: OfficialReportChairman.from(
        helpers.makeChairman({
          id: `chairman-0000`,
        }),
      ),
    });

    const updateChairman = OfficialReportChairman.from(
      helpers.makeChairman({
        id: `chairman-1001`,
      }),
    );

    const { diff, next } = snapshot.update({
      ...update,
      chairman: updateChairman,
    });

    expect(next.chairman.equals(updateChairman)).toBe(true);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('OUTDATED');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the secretary difference', () => {
    const { snapshot, update } = makeSnapshot();

    const updateSecretary = OfficialReportSecretary.from(helpers.makeSecretary());
    const { diff, next } = snapshot.update({
      ...update,
      secretary: updateSecretary,
    });

    expect(next.secretary.equals(updateSecretary)).toBe(true);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('OUTDATED');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the hasRenunciation difference', () => {
    const { snapshot, update } = makeSnapshot({ hasRenunciation: true });
    expect(snapshot.meta.hasRenunciation).toBe(true);

    const { diff, next } = snapshot.update({
      ...update,
      hasRenunciation: false,
    });

    expect(next.hasRenunciation).toBe(false);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('NOOP');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the justiceDepartmentContactId difference', () => {
    const { snapshot, update } = makeSnapshot({ justiceDepartmentContactId: 1001n });

    const { diff, next } = snapshot.update({
      ...update,
      justiceDepartmentContactId: 2002n,
    });

    expect(next.justiceDepartmentContactId).toBe(2002n);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('NOOP');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the members difference', () => {
    const { snapshot, update } = makeSnapshot({
      members: OfficialReportMembersList.from(
        [0, 1].map((id) => OfficialReportMember.from(helpers.makeMember({ id: `member-${id}` }))),
      ),
    });

    const updateMembers = OfficialReportMembersList.from(
      [1000, 1001].map((id) => OfficialReportMember.from(helpers.makeMember({ id: `member-${id}` }))),
    );
    const { diff, next } = snapshot.update({
      ...update,
      members: updateMembers,
    });

    expect(next.members.equals(updateMembers)).toBe(true);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('NOOP');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the sessionMeeting difference', () => {
    const { snapshot, update } = makeSnapshot({
      sessionMeeting: OfficialReportSessionMeeting.from({
        date: DateOnly.fromJson({ year: 2026, month: 6, day: 2 }),
        startTime: { hours: 18, minutes: 0, seconds: 0 },
        endTime: { hours: 18, minutes: 10, seconds: 0 },
      }),
    });

    const updateSessionMeeting = OfficialReportSessionMeeting.from({
      date: DateOnly.fromJson({ year: 2026, month: 7, day: 2 }),
      startTime: { hours: 18, minutes: 0, seconds: 0 },
      endTime: { hours: 18, minutes: 10, seconds: 0 },
    });

    const { diff, next } = snapshot.update({
      ...update,
      sessionMeeting: updateSessionMeeting,
    });

    expect(next.sessionMeeting.equals(updateSessionMeeting)).toBe(true);

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('OUTDATED');
    expect(diff.conclusion).toBe('NOOP');
    expect(diff.files.map((f) => f.action)).toEqual(['noop']);
  });

  it('should detect the files difference', () => {
    const { snapshot, update, file } = makeSnapshot();

    const updatedFile = {
      ...file,
      outcome: { value: file.outcome.value, comment: 'an updated comment' },
    } satisfies PlainOfficialReportSnapshotFile;

    const { diff } = snapshot.update({
      ...update,
      files: [updatedFile],
    });

    const firstFile = diff.files[0]!;

    assert.ok(firstFile.action === 'update');

    expect(firstFile.id).toBe(file.id);
    expect(firstFile.outcome).toBe('VALIDATED');
    expect(firstFile.outcomeComment).toBe('an updated comment');

    expect(diff.hasAny).toBe(true);
    expect(diff.intro).toBe('NOOP');
    expect(diff.conclusion).toBe('NOOP');
  });

  describe('invalidate', () => {
    it('marks the intro outdated when the session date changed', () => {
      const { snapshot } = makeSnapshot();

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'SessionDateUpdated',
        payload: {
          sessionId: 'session-1',
          currentDate: { year: 2027, month: 1, day: 1 },
          previousDate: { year: 2027, month: 1, day: 2 },
        },
      });

      expect(diff.intro).toBe('OUTDATED');
      expect(diff.conclusion).toBe('NOOP');
      expect(diff.hasAny).toBe(true);
    });

    it('marks the intro outdated when the session date was null', () => {
      const { snapshot } = makeSnapshot();

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'SessionDateUpdated',
        payload: {
          sessionId: 'session-1',
          currentDate: { year: 2027, month: 1, day: 1 },
          previousDate: null,
        },
      });

      expect(diff.intro).toBe('OUTDATED');
    });

    it('does nothing when the session date is unchanged', () => {
      const { snapshot } = makeSnapshot({
        agenda: {
          id: 'agenda-1',
          formation: 'SIEGE',
          date: new DateOnly(2026, 3, 1),
          session: {
            id: 'session-1',
            date: new DateOnly(2026, 2, 20),
          },
        },
        sessionMeeting: OfficialReportSessionMeeting.from({
          date: DateOnly.fromJson({ year: 2026, month: 4, day: 10 }),
          startTime: { hours: 18, minutes: 0, seconds: 0 },
          endTime: { hours: 18, minutes: 10, seconds: 0 },
        }),
      });

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'SessionDateUpdated',
        payload: {
          sessionId: 'session-1',
          currentDate: { year: 2026, month: 2, day: 20 },
          previousDate: { year: 2026, month: 2, day: 20 },
        },
      });

      expect(diff.hasAny).toBe(false);
    });

    it('marks the intro outdated when the agenda date changed', () => {
      const { snapshot } = makeSnapshot();

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'AgendaDateUpdated',
        payload: {
          agendaId: 'agenda-1',
          currentDate: { year: 2027, month: 1, day: 1 },
          previousDate: { year: 2027, month: 1, day: 2 },
        },
      });

      expect(diff.intro).toBe('OUTDATED');
      expect(diff.hasAny).toBe(true);
    });

    it('should detect unknown file', () => {
      const { snapshot } = makeSnapshot({
        files: new Map([
          [
            'file-1',
            OfficialReportSnapshotFile.from({
              hasManuallyEditedHtml: true,
              id: 1n,
              nominationFileId: 'file-1',
              outcome: { value: 'VALIDATED', comment: null },
              reporters: ['M. John DOE'],
            }),
          ],
        ]),
      });

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'AgendaNominationFilesUpdated',
        payload: {
          files: [
            {
              nominationFileId: `file-1`,
              outcome: { value: 'VALIDATED', comment: null },
              reporters: ['M. John DOE'],
            },
            {
              nominationFileId: `file-2`,
              outcome: { value: 'VALIDATED', comment: null },
              reporters: ['M. John DOE'],
            },
          ],
        },
      });

      const fileToCreate = diff.files.find((x) => x.action === 'create');
      expect(fileToCreate?.nominationFileId).toBe('file-2');

      expect(diff).toMatchObject({ intro: 'NOOP', conclusion: 'NOOP', hasAny: true });
    });

    it('does nothing when the agenda nomination files are unchanged', () => {
      const { snapshot, file } = makeSnapshot();

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'AgendaNominationFilesUpdated',
        payload: {
          files: [
            { nominationFileId: file.nominationFileId, outcome: file.outcome, reporters: file.reporters },
          ],
        },
      });

      expect(diff.hasAny).toBe(false);
    });

    it('flags an outcome change on a generated file as update', () => {
      const { snapshot } = makeSnapshot();
      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'NominationFilesOutcomeUpdated',
        payload: { files: [{ nominationFileId: 'file-1', outcome: { value: 'WITHDRAWN', comment: null } }] },
      });

      const fileToUpdate = diff.files.find(
        (f): f is Extract<typeof f, { action: 'outdate' | 'update' }> => f.action === 'update',
      );
      expect(fileToUpdate?.outcome).toBe('WITHDRAWN');
      expect(fileToUpdate?.outcomeComment).toBeNull();

      expect(diff).toMatchObject({ intro: 'NOOP', conclusion: 'NOOP', hasAny: true });
    });

    it('flags an outcome change on a manually edited file as OUTDATED', () => {
      const { snapshot } = makeSnapshot({
        files: new Map([
          [
            'file-1',
            OfficialReportSnapshotFile.from({
              id: 0n,
              nominationFileId: 'file-1',
              hasManuallyEditedHtml: true,
              reporters: ['M. John DOE'],
              outcome: { value: 'VALIDATED', comment: null },
            }),
          ],
        ]),
      });

      const diff = snapshot.invalidate({
        id: 'or-1',
        type: 'NominationFilesOutcomeUpdated',
        payload: {
          files: [{ nominationFileId: 'file-1', outcome: { value: 'WITHDRAWN', comment: null } }],
        },
      });

      const fileToOutdate = diff.files.find(
        (file): file is Extract<typeof file, { action: 'outdate' | 'update' }> => file.action === 'outdate',
      );
      expect(fileToOutdate?.outcome).toBe('WITHDRAWN');
      expect(fileToOutdate?.outcomeComment).toBeNull();

      expect(diff).toMatchObject({ intro: 'NOOP', conclusion: 'NOOP', hasAny: true });
    });
  });
});

function makeSnapshot(props: Partial<PlainOfficialReportSnapshot> = {}) {
  const file = {
    id: 0n,
    nominationFileId: 'file-1',
    hasManuallyEditedHtml: false,
    outcome: { value: 'VALIDATED', comment: null },
    reporters: ['M. John DOE'],
  } as const satisfies PlainOfficialReportSnapshotFile;

  const snapshot = OfficialReportSnapshot.from(
    helpers.makeSnapshot({
      files: new Map([file].map((f) => [f.nominationFileId, OfficialReportSnapshotFile.from(f)])),
      manuallyEditedPart: { intro: true, conclusion: true },
      ...props,
    }),
  );

  const update: UpdateOfficialReportCommand['officialReport'] = {
    agenda: snapshot.meta.agenda,
    chairman: snapshot.meta.chairman,
    secretary: snapshot.meta.secretary,
    hasRenunciation: snapshot.meta.hasRenunciation,
    justiceDepartmentContactId: snapshot.meta.justiceDepartmentContactId,
    members: snapshot.meta.members,
    sessionMeeting: snapshot.meta.sessionMeeting,
    files: [file],
  };

  return { file, snapshot, update };
}
