import { Link } from 'react-router-dom';
import Button from '@codegouvfr/react-dsfr/Button';
import Card from '@codegouvfr/react-dsfr/Card';

import type { ObservationDetails } from '@queries/observations.queries';
import { getObservationDetailsPath } from '../../utils/route-path.utils';

type ObservationDetailsContentProps = {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  observation: ObservationDetails;
  onDownloadFile: (fileId: string) => void;
  backLink: {
    to: string;
    label: string;
  };
  context: 'sg' | 'membre';
};

export function ObservationDetailsContent({
  sessionId,
  observation,
  onDownloadFile,
  backLink,
  context
}: ObservationDetailsContentProps) {
  const observant = observation.observant;
  const candidacy = observant.candidacy;
  const relatedPropositions = observation.relatedPropositions ?? [];

  return (
    <>
      <div className="fr-mb-4w">
        <Link to={backLink.to} className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          {backLink.label}
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
                <dd className="fr-col-8 fr-m-0">{observation.receptionDate}</dd>
              </div>
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Magistrat observé :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.observedMagistrat?.name}</dd>
              </div>
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Poste observé :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.observedMagistrat?.proposedPosition ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section className="fr-mb-4w">
            <h2 className="fr-h4">Magistrat observant</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">NOM Prénom :</dt>
                <dd className="fr-col-8 fr-m-0">
                  {observant.lastName.toUpperCase()} {observant.firstName}
                </dd>
              </div>
              {candidacy && (
                <>
                  {candidacy.desiredPosition && (
                    <div className="fr-grid-row fr-mb-2w">
                      <dt className="fr-col-4 fr-text--bold">Poste souhaité :</dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.desiredPosition}</dd>
                    </div>
                  )}
                  {candidacy.rank && (
                    <div className="fr-grid-row fr-mb-2w">
                      <dt className="fr-col-4 fr-text--bold">Rang :</dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.rank}</dd>
                    </div>
                  )}
                </>
              )}
              {observant.biography && (
                <div className="fr-grid-row fr-mb-2w">
                  <dt className="fr-col-4 fr-text--bold">Biographie :</dt>
                  <dd className="fr-col-8 fr-m-0 whitespace-pre-wrap">{observant.biography}</dd>
                </div>
              )}
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
                      onClick={() => onDownloadFile(file.id)}
                    >
                      {file.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {relatedPropositions.length > 0 && (
            <section className="fr-mb-4w">
              <h2 className="fr-h4">Propositions liées</h2>
              <p className="fr-text--sm fr-mb-2w">
                Autres propositions sur lesquelles ce magistrat a formulé une observation
              </p>
              <div className="fr-grid-row fr-grid-row--gutters">
                {relatedPropositions.map((proposition) => (
                  <div key={proposition.observationId} className="fr-col-12 fr-col-md-6">
                    <Card
                      title={proposition.magistratName}
                      desc={
                        <div className="fr-text--sm">
                          {proposition.number && <p className="fr-mb-1v">N° {proposition.number}</p>}
                          <p className="fr-mb-1v">{proposition.proposedPosition ?? '-'}</p>
                          <p className="fr-mb-0 fr-text--light">
                            Observation du {proposition.observationDate}
                          </p>
                        </div>
                      }
                      linkProps={{
                        to: getObservationDetailsPath(
                          {
                            sessionId,
                            nominationFileId: proposition.nominationFileId,
                            observationId: proposition.observationId
                          },
                          context
                        )
                      }}
                      enlargeLink
                      size="small"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
