import { Navigate, useParams, useLocation } from 'react-router-dom';

import { useObservationDetailsQuery, useGetObservationFileUrlMutation } from '@queries/observations.queries';
import { PageContentLayout } from '../../../components/shared/PageContentLayout';
import { ObservationDetailsContent } from '../../../components/shared/ObservationDetailsContent';
import { getDetailSessionGdsPath } from '../../../utils/route-path.utils';

export function ObservationDetailsPage() {
  const { sessionId, nominationFileId, observationId } = useParams<{
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }>();

  const location = useLocation();
  const isSgContext = location.pathname.startsWith('/secretariat-general');
  const context = isSgContext ? 'sg' : 'membre';

  const {
    data: observation,
    isLoading,
    isError
  } = useObservationDetailsQuery({
    sessionId: sessionId ?? '',
    nominationFileId: nominationFileId ?? '',
    observationId: observationId ?? ''
  });

  const { mutate: getFileUrl } = useGetObservationFileUrlMutation();

  if (isLoading) {
    return (
      <PageContentLayout>
        <p>Chargement...</p>
      </PageContentLayout>
    );
  }

  const fallbackPath = isSgContext
    ? `/secretariat-general/session/${sessionId}`
    : getDetailSessionGdsPath({ sessionId: sessionId ?? '' });

  if (!observationId || !sessionId || !nominationFileId || isError || !observation) {
    return <Navigate replace={true} to={fallbackPath} />;
  }

  const handleDownloadFile = (fileId: string) => {
    getFileUrl(
      { sessionId, nominationFileId, observationId, fileId },
      { onSuccess: (url) => window.open(url, '_blank') }
    );
  };

  const backLink = isSgContext
    ? { to: `/secretariat-general/session/${sessionId}`, label: 'Retour à la session' }
    : { to: getDetailSessionGdsPath({ sessionId }), label: 'Retour à la session' };

  return (
    <PageContentLayout>
      <ObservationDetailsContent
        sessionId={sessionId}
        nominationFileId={nominationFileId}
        observationId={observationId}
        observation={observation}
        onDownloadFile={handleDownloadFile}
        backLink={backLink}
        context={context}
      />
    </PageContentLayout>
  );
}
