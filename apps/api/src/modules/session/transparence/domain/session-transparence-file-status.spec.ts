import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import type { NominationFileOutcomeEnum } from 'src/modules/session/shared/types/nomination-file-outcome';

import { transparenceFileStatus } from './session-transparence-file-status';

const AGENDA_DATE = new Date('2026-06-01T09:00:00.000Z');
const OFFICIAL_REPORT_DATE = new Date('2026-06-08T09:00:00.000Z');

function makeDoc(props: {
  agendaDate?: Date;
  officialReport?: {
    isValidated: boolean;
    outcome: DocNominationFileOutcomeEnum;
    sessionMeetingDate?: Date;
  };
}) {
  return {
    agenda: { id: 'agenda-id', outcome: null, sessionMeetingDate: props.agendaDate ?? AGENDA_DATE },
    officialReport: props.officialReport
      ? {
          id: 'official-report-id',
          isValidated: props.officialReport.isValidated,
          outcome: props.officialReport.outcome,
          sessionMeetingDate: props.officialReport.sessionMeetingDate ?? OFFICIAL_REPORT_DATE,
        }
      : null,
  };
}

describe('transparenceFileStatus', () => {
  it('waits as long as the file belongs to no document', () => {
    expect(transparenceFileStatus({ docs: [], outcome: null })).toEqual({
      value: 'TO_REPORT',
      date: null,
    });
  });

  it('is planned once listed in an agenda, dated after that agenda', () => {
    expect(transparenceFileStatus({ docs: [makeDoc({})], outcome: 'VALIDATED' })).toEqual({
      value: 'DSJ_PLANNED',
      date: AGENDA_DATE,
    });
  });

  it('stays planned while the official report is generated but not validated', () => {
    const docs = [makeDoc({ officialReport: { isValidated: false, outcome: 'VALIDATED' } })];

    expect(transparenceFileStatus({ docs, outcome: 'VALIDATED' })).toEqual({
      value: 'DSJ_PLANNED',
      date: AGENDA_DATE,
    });
  });

  it('is reported once the official report is validated, dated after that report', () => {
    const docs = [makeDoc({ officialReport: { isValidated: true, outcome: 'VALIDATED' } })];

    expect(transparenceFileStatus({ docs, outcome: 'VALIDATED' })).toEqual({
      value: 'DSJ_REPORTED',
      date: OFFICIAL_REPORT_DATE,
    });
  });

  it('stays reported while a suspended file keeps its suspended outcome', () => {
    const docs = [makeDoc({ officialReport: { isValidated: true, outcome: 'SUSPENDED' } })];

    expect(
      transparenceFileStatus({ docs, outcome: 'SUSPENDED' satisfies NominationFileOutcomeEnum }),
    ).toEqual({ value: 'DSJ_REPORTED', date: OFFICIAL_REPORT_DATE });
  });

  it('waits again when a file reported as suspended gets a final outcome', () => {
    const docs = [makeDoc({ officialReport: { isValidated: true, outcome: 'SUSPENDED' } })];

    expect(transparenceFileStatus({ docs, outcome: 'VALIDATED' })).toEqual({
      value: 'TO_REPORT',
      date: null,
    });
  });

  it('keeps the most recent agenda when several are still pending', () => {
    const lastAgendaDate = new Date('2026-07-01T09:00:00.000Z');
    const docs = [makeDoc({}), makeDoc({ agendaDate: lastAgendaDate })];

    expect(transparenceFileStatus({ docs, outcome: 'VALIDATED' })).toEqual({
      value: 'DSJ_PLANNED',
      date: lastAgendaDate,
    });
  });
});
