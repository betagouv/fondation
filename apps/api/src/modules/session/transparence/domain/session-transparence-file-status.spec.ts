import { transparenceFileStatus } from './session-transparence-file-status';

const AGENDA_DATE = new Date('2026-06-01T09:00:00.000Z');
const OFFICIAL_REPORT_DATE = new Date('2026-06-08T09:00:00.000Z');
const LATER_AGENDA_DATE = new Date('2026-07-01T09:00:00.000Z');
const LATER_OFFICIAL_REPORT_DATE = new Date('2026-07-08T09:00:00.000Z');

function makeDoc(props: {
  agendaDate?: Date;
  officialReport?: { isValidated: boolean; sessionMeetingDate?: Date };
}) {
  return {
    agenda: { sessionMeetingDate: props.agendaDate ?? AGENDA_DATE },
    officialReport: props.officialReport
      ? {
          isValidated: props.officialReport.isValidated,
          sessionMeetingDate: props.officialReport.sessionMeetingDate ?? OFFICIAL_REPORT_DATE,
        }
      : null,
  };
}

describe('transparenceFileStatus', () => {
  it('waits as long as the file belongs to no document', () => {
    expect(transparenceFileStatus({ docs: [] })).toEqual({ dates: [], value: 'TO_REPORT' });
  });

  it('is planned once listed in an agenda, dated after that agenda', () => {
    expect(transparenceFileStatus({ docs: [makeDoc({})] })).toEqual({
      dates: [AGENDA_DATE],
      value: 'DSJ_PLANNED',
    });
  });

  it('stays planned while the official report is generated but not validated', () => {
    const docs = [makeDoc({ officialReport: { isValidated: false } })];

    expect(transparenceFileStatus({ docs })).toEqual({ dates: [AGENDA_DATE], value: 'DSJ_PLANNED' });
  });

  it('is reported once the official report is validated, dated after that report', () => {
    const docs = [makeDoc({ officialReport: { isValidated: true } })];

    expect(transparenceFileStatus({ docs })).toEqual({
      dates: [OFFICIAL_REPORT_DATE],
      value: 'DSJ_REPORTED',
    });
  });

  it('is planned again when a later agenda lists a reported file', () => {
    const docs = [
      makeDoc({ officialReport: { isValidated: true } }),
      makeDoc({ agendaDate: LATER_AGENDA_DATE }),
    ];

    expect(transparenceFileStatus({ docs })).toEqual({ dates: [LATER_AGENDA_DATE], value: 'DSJ_PLANNED' });
  });

  it('is reported again once the later agenda has its official report validated', () => {
    const docs = [
      makeDoc({ officialReport: { isValidated: true } }),
      makeDoc({
        agendaDate: LATER_AGENDA_DATE,
        officialReport: { isValidated: true, sessionMeetingDate: LATER_OFFICIAL_REPORT_DATE },
      }),
    ];

    expect(transparenceFileStatus({ docs })).toEqual({
      dates: [LATER_OFFICIAL_REPORT_DATE],
      value: 'DSJ_REPORTED',
    });
  });

  it('ignores an earlier agenda left without official report', () => {
    const docs = [
      makeDoc({}),
      makeDoc({
        agendaDate: LATER_AGENDA_DATE,
        officialReport: { isValidated: true, sessionMeetingDate: LATER_OFFICIAL_REPORT_DATE },
      }),
    ];

    expect(transparenceFileStatus({ docs })).toEqual({
      dates: [LATER_OFFICIAL_REPORT_DATE],
      value: 'DSJ_REPORTED',
    });
  });

  it('keeps one date per meeting when two agendas share it', () => {
    const docs = [makeDoc({}), makeDoc({})];

    expect(transparenceFileStatus({ docs })).toEqual({ dates: [AGENDA_DATE], value: 'DSJ_PLANNED' });
  });
});
