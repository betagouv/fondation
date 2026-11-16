import { Outlet, useParams } from 'react-router';

import { AgendaNotFound } from '@/features/documents/components/agenda/AgendaNotFound';
import { SessionNotFound } from '@/features/transparence/components/session/SessionNotFound';
import { isNotFound } from '@/utils/http-exception';
import { useDetailsAgendaMetadataQuery } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

// the pages below mount at once, so they share the requests made here and start their own alongside:
// waiting for these before rendering them would request the metadata twice and the document later
export function AgendaLayout() {
  const { agendaId, sessionId = '' } = useParams();

  const session = useDetailedNominationSessionQuery({ sessionId });
  const agenda = useDetailsAgendaMetadataQuery({ agendaId });

  // a failed reload keeps the data loaded before: the page stays rather than the error page
  if (session.error && !isNotFound(session.error) && !session.data) throw session.error;
  if (isNotFound(session.error)) return <SessionNotFound context="sg" />;

  if (agenda.error && !isNotFound(agenda.error) && !agenda.data) throw agenda.error;
  if (isNotFound(agenda.error)) return <AgendaNotFound sessionId={sessionId} />;

  return <Outlet />;
}
