import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import { OfficialReportAgenda, OfficialReportAgendaAlreadyReported } from './official-report-agenda';

describe('OfficialReportAgenda', () => {
  it('should prevent creating an agenda, when already reported', () => {
    expect(() => {
      OfficialReportAgenda.from({
        ignoreOfficialReportId: makeId('OfficialReportId', 'or-2'),
        agenda: {
          id: 'agenda-1',
          formation: 'SIEGE',
          officialReportId: 'or-1',
          date: new DateOnly(2026, 3, 1),
          session: { id: 'session-1', date: new DateOnly(2026, 2, 20) },
        },
      });
    }).toThrow(new OfficialReportAgendaAlreadyReported('agenda-1'));
  });

  it('should allow creating an agenda', () => {
    const agenda = OfficialReportAgenda.from({
      ignoreOfficialReportId: makeId('OfficialReportId', 'or-1'),
      agenda: {
        id: 'agenda-1',
        formation: 'SIEGE',
        officialReportId: 'or-1',
        date: new DateOnly(2026, 3, 1),
        session: { id: 'session-1', date: new DateOnly(2026, 2, 20) },
      },
    });

    expect(agenda).toBeInstanceOf(OfficialReportAgenda);
  });
});
