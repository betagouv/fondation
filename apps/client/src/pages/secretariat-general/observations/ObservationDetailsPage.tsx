import { Navigate, useParams, Link } from 'react-router-dom';
import Button from '@codegouvfr/react-dsfr/Button';

import { useObservationDetailsQuery, useGetObservationFileUrlMutation } from '@queries/observations.queries';
import { PageContentLayout } from '../../../components/shared/PageContentLayout';

export function ObservationDetailsPage() {
  const { sessionId, nominationFileId, observationId } = useParams<{
    sessionId: string;
    nominationFileId: string;
    observationId: string;
  }>();

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

  if (!observationId || !sessionId || !nominationFileId || isError || !observation) {
    return <Navigate replace={true} to={`/secretariat-general/session/${sessionId}`} />;
  }

  const handleDownloadFile = (fileId: string) => {
    getFileUrl(
      { sessionId, nominationFileId, observationId, fileId },
      { onSuccess: (url) => window.open(url, '_blank') }
    );
  };

  return (
    <PageContentLayout>
      <div className="fr-mb-4w">
        <Link
          to={`/secretariat-general/session/${sessionId}`}
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
        >
          Retour à la session
        </Link>
      </div>

      <h1 className="fr-h2 fr-mb-4w">Fiche observation</h1>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-lg-8">
          <section className="fr-mb-4w">
            <h2 className="fr-h4">Rappel</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Date de réception :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.dateReception}</dd>
              </div>
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Magistrat observé :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.magistratObserve.nom}</dd>
              </div>
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Poste observé :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.magistratObserve.postePropose ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section className="fr-mb-4w">
            <h2 className="fr-h4">Magistrat observant</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">NOM Prénom :</dt>
                <dd className="fr-col-8 fr-m-0">
                  {observation.observant.lastName.toUpperCase()} {observation.observant.firstName}
                </dd>
              </div>
            </dl>
          </section>

          <section className="fr-mb-4w">
            <h2 className="fr-h4">Pièce(s) jointe(s)</h2>
            {observation.files.length === 0 ? (
              <p className="fr-text--sm text-gray-500">Aucune pièce jointe</p>
            ) : (
              <ul className="fr-raw-list">
                {observation.files.map((file) => (
                  <li key={file.id} className="fr-mb-1w">
                    <Button
                      priority="tertiary no outline"
                      iconId="ri-file-download-line"
                      onClick={() => handleDownloadFile(file.id)}
                    >
                      {file.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageContentLayout>
  );
}
