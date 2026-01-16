import { useParams } from 'react-router-dom';

import { useSummaryQuery } from '@queries/summary.queries';
import { SummaryContext } from './SummaryContext';
import { HttpException } from '@/utils/http-exception';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { SummaryNotFound } from './SummaryNotFound';

function SummaryPageInner() {
  const params = useParams<{ sessionId: string; fileId: string }>();
  const sessionId = params.sessionId!;
  const nominationFileId = params.fileId!;

  const { data, isLoading, error, isFetched } = useSummaryQuery({
    sessionId: sessionId!,
    nominationFileId: nominationFileId!
  });

  if (isLoading) {
    return (
      <div className="fr-container mt-8 text-center">
        <p>Chargement...</p>;
      </div>
    );
  }

  const notFound =
    isFetched && ((error && error instanceof HttpException && error.statusCode === 404) || !data);

  return (
    <SummaryContext value={{ sessionId, nominationFileId, summary: data ?? null }}>
      {notFound ? <SummaryNotFound /> : <p>Synthèse {nominationFileId}</p>}
    </SummaryContext>
  );
}

export function SummaryPage() {
  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <SummaryPageInner />
    </AuthGuard>
  );
}
