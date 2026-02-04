import Button from '@codegouvfr/react-dsfr/Button';
import Card from '@codegouvfr/react-dsfr/Card';
import { Link } from 'react-router-dom';

import { TipTapEditor } from '@/components/reports/components/ReportOverview/TipTapEditor';
import type { FilesUploader } from '@/components/reports/components/ReportOverview/TipTapEditor/extensions/editor-file-uploader';
import { DateOnly } from '@/models/date-only.model';
import type { ObservationDetails } from '@queries/observations.queries';
import { getObservationDetailsPath } from '../../utils/route-path.utils';
import { LolfiMagistratLink } from './LolfiMagistratLink';
import { ObservationFollowUpSelector } from './observations/follow-up-selector/ObservationFollowUpSelector';

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
  onUpdateMemberComment?: (comment: string) => void;
  uploadFiles?: FilesUploader;
};

export function ObservationDetailsContent({
  sessionId,
  observation,
  nominationFileId,
  onDownloadFile,
  backLink,
  context,
  onUpdateMemberComment,
  uploadFiles
}: ObservationDetailsContentProps) {
  const observant = observation.observant;
  const candidacy = observant.candidacy;
  const relatedPropositions = observation.relatedPropositions ?? [];

  return (
    <div className="bg-white p-8">
      <div className="fr-mb-4w">
        <Link to={backLink.to} className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          {backLink.label}
        </Link>
      </div>

      <h1 className="fr-h2 fr-mb-4w flex items-center justify-between">
        <span>Fiche observation</span>
        <ObservationFollowUpSelector
          sessionId={sessionId}
          nominationFileId={nominationFileId}
          observationId={observation.id}
          followUp={observation.followUp}
          comment={observation.followUpComment}
        />
      </h1>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-lg-8">
          <section className="fr-mb-4w">
            <h2 className="fr-h4">Rappel</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Date de réception :</dt>
                <dd className="fr-col-8 fr-m-0">{DateOnly.fromDateOnly(observation.receptionDate)}</dd>
              </div>
              <div className="fr-grid-row fr-mb-2w">
                <dt className="fr-col-4 fr-text--bold">Magistrat observé :</dt>
                <dd className="fr-col-8 fr-m-0 flex items-center gap-2">
                  {observation.observedMagistrat?.name}
                  <LolfiMagistratLink
                    sessionId={sessionId}
                    nominationFileId={nominationFileId}
                    name={observation.observedMagistrat?.name}
                    small
                  />
                </dd>
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
                <dd className="fr-col-8 fr-m-0 flex items-center gap-2">
                  <span>
                    {observant.lastName.toUpperCase()} {observant.firstName}
                  </span>
                  {/* TODO revoir cette partie, conditionné au fait que l'observant soit un candidat.  */}
                  {candidacy && (
                    <LolfiMagistratLink
                      sessionId={sessionId}
                      nominationFileId={candidacy.nominationFileId}
                      name={`${observant.lastName.toUpperCase()} ${observant.firstName}`}
                      small
                    />
                  )}
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

          {context === 'membre' && observation.memberComment && onUpdateMemberComment && (
            <section className="fr-mb-4w">
              <h2 className="fr-h4" id="member-comment-label">
                Mon commentaire
              </h2>
              <TipTapEditor
                value={observation.memberComment.comment ?? ''}
                onChange={onUpdateMemberComment}
                ariaLabelledby="member-comment-label"
                uploadFiles={uploadFiles}
              />
            </section>
          )}

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
                        <span className="fr-text--sm">
                          {proposition.number && <span className="mb-1 block">N° {proposition.number}</span>}
                          <span className="mb-1 block">{proposition.proposedPosition ?? '-'}</span>
                          <span className="block text-gray-500">
                            Observation du {DateOnly.fromDateOnly(proposition.observationDate)}
                          </span>
                        </span>
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
    </div>
  );
}
