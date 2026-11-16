import { Outlet, useParams } from 'react-router';

import { OfficialReportNotFound } from '@/features/documents/components/official-report/OfficialReportNotFound';
import { SessionNotFound } from '@/features/transparence/components/session/SessionNotFound';
import { isNotFound } from '@/utils/http-exception';
import { useDetailsOfficialReportQuery } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

// the pages below mount at once, so they share the requests made here and start their own alongside:
// waiting for these before rendering them would request the details twice and the document later
export function OfficialReportLayout() {
  const { officialReportId, sessionId = '' } = useParams();

  const session = useDetailedNominationSessionQuery({ sessionId });
  const officialReport = useDetailsOfficialReportQuery({ officialReportId });

  // a failed reload keeps the data loaded before: the page stays rather than the error page
  if (session.error && !isNotFound(session.error) && !session.data) throw session.error;
  if (isNotFound(session.error)) return <SessionNotFound context="sg" />;

  if (officialReport.error && !isNotFound(officialReport.error) && !officialReport.data) {
    throw officialReport.error;
  }
  // a missing session comes first: wait for it before saying that only the official report is missing
  if (isNotFound(officialReport.error)) {
    return session.isPending ? null : <OfficialReportNotFound sessionId={sessionId} />;
  }

  return <Outlet />;
}
