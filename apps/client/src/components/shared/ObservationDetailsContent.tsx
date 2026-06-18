import Button from '@codegouvfr/react-dsfr/Button';
import Card from '@codegouvfr/react-dsfr/Card';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { getObservationDetailsPath } from '../../utils/route-path.utils';
import { TipTapEditor } from '@/components/shared/ui/tip-tap-editor';
import type { FilesUploader } from '@/components/shared/ui/tip-tap-editor/extensions/editor-file-uploader';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { dateOnlyToDate } from '@/utils/date-only.util';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { LolfiMagistratLink } from './LolfiMagistratLink';
import { ObservationDescription } from './ObservationDescription';
import { ObservationFollowUpSelector } from './observations/follow-up-selector/ObservationFollowUpSelector';

type ObservationDetailsContentProps = {
  sessionId: string;
  nominationFileId: string;
  observationId: string;
  observation: GetObservationDetailsResponseDto;
  onDownloadFile: (fileId: string) => void;
  backLink: {
    to: string;
    label: string;
  };
  context: 'sg' | 'membre';
  onUpdateMemberComment?: (comment: string) => void;
  uploadFiles?: FilesUploader;
  isArchived: boolean;
};

export function ObservationDetailsContent({
  sessionId,
  observation,
  nominationFileId,
  onDownloadFile,
  backLink,
  context,
  onUpdateMemberComment,
  uploadFiles,
  isArchived,
}: ObservationDetailsContentProps) {
  const isSg = useIsSg();
  const observant = observation.observant;
  const candidacy = observant.candidacy;
  const relatedPropositions = observation.relatedPropositions ?? [];

  const biographyItems = observant.biography
    ?.split('- ')
    .map((x) => x.trim())
    .filter((x) => !!x)
    .map((part, i) => <li key={`observer_biography_${i}`}>{part}</li>);

  return (
    <div className="fr-p-8v bg-(--background-default-grey)">
      <div className="fr-mb-8v">
        <Link to={backLink.to} className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          {backLink.label}
        </Link>
      </div>

      <h1 className="fr-h2 fr-mb-8v flex items-center justify-between">
        <span>Fiche observation</span>
        <ObservationFollowUpSelector
          isArchived={isArchived}
          sessionId={sessionId}
          nominationFileId={nominationFileId}
          observationId={observation.id}
          followUp={observation.followUp}
          comment={observation.followUpComment}
        />
      </h1>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-lg-8">
          <section className="fr-mb-8v">
            <h2 className="fr-h4">Rappel</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">Date de réception :</dt>
                <dd className="fr-col-8 fr-m-0">
                  <FormattedMessage
                    defaultMessage="{date, date, dateOnlyShort}"
                    values={{ date: dateOnlyToDate(observation.receptionDate) }}
                  />
                </dd>
              </div>
              <div className="fr-grid-row fr-mb-4v">
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
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">Poste observé :</dt>
                <dd className="fr-col-8 fr-m-0">{observation.observedMagistrat?.proposedPosition ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section className="fr-mb-8v">
            <h2 className="fr-h4">Magistrat observant</h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">NOM Prénom :</dt>
                <dd className="fr-col-8 fr-m-0 flex items-center gap-2">
                  <span>
                    {observant.lastName.toUpperCase()} {observant.firstName}
                  </span>
                  <Button
                    size="small"
                    className="rounded-full after:hidden"
                    priority="tertiary no outline"
                    title="vers LOLFI"
                    iconId="fr-icon-external-link-line"
                    iconPosition="right"
                    linkProps={{ target: '_blank', href: observant.externalUrl }}
                    // oxlint-disable-next-line react/no-children-prop
                    children={undefined /* FIXME: TS issue otherwise */}
                  />
                </dd>
              </div>
              {candidacy && (
                <>
                  {candidacy.desiredPosition && (
                    <div className="fr-grid-row fr-mb-4v">
                      <dt className="fr-col-4 fr-text--bold">Poste souhaité :</dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.desiredPosition}</dd>
                    </div>
                  )}
                  {candidacy.rank && (
                    <div className="fr-grid-row fr-mb-4v">
                      <dt className="fr-col-4 fr-text--bold">Rang :</dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.rank}</dd>
                    </div>
                  )}
                </>
              )}
              {observant.biography && (
                <div className="fr-grid-row fr-mb-4v">
                  <dt className="fr-col-4 fr-text--bold">Biographie :</dt>
                  <dd className="fr-col-8 fr-m-0 whitespace-pre-wrap">
                    <ul className="fr-p-0 list-['-_']">{biographyItems}</ul>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {context === 'membre' &&
            observation.isMemberReporter &&
            ((!isArchived && onUpdateMemberComment) ||
              (isArchived && observation.memberComment?.comment)) && (
              <section className="fr-mb-8v">
                <h2 className="fr-h4" id="member-comment-label">
                  Mon commentaire
                </h2>
                {isArchived ? (
                  <div
                    className="fr-p-2v rounded bg-(--background-contrast-grey)"
                    dangerouslySetInnerHTML={{ __html: observation.memberComment?.comment ?? '' }}
                  />
                ) : (
                  <TipTapEditor
                    value={observation.memberComment?.comment ?? ''}
                    onChange={onUpdateMemberComment!}
                    ariaLabelledby="member-comment-label"
                    uploadFiles={uploadFiles}
                  />
                )}
              </section>
            )}

          {observation.description || (!isArchived && isSg) ? (
            <section className="fr-mb-8v">
              <ObservationDescription
                sessionId={sessionId}
                nominationFileId={nominationFileId}
                observation={observation}
                isArchived={isArchived}
              />
            </section>
          ) : null}

          <section className="fr-mb-8v">
            <h2 className="fr-h4">Pièce(s) jointe(s)</h2>
            {observation.files.length === 0 ? (
              <p className="fr-text--sm text-(--text-mention-grey)">Aucune pièce jointe</p>
            ) : (
              <ul className="fr-raw-list">
                {observation.files.map((file) => (
                  <li key={file.id} className="fr-mb-2v">
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
            <section className="fr-mb-8v">
              <h2 className="fr-h4">Propositions liées</h2>
              <p className="fr-text--sm fr-mb-4v">
                Autres propositions sur lesquelles ce magistrat a formulé une observation
              </p>
              <div className="fr-grid-row fr-grid-row--gutters">
                {relatedPropositions.map((proposition) => (
                  <div key={proposition.observationId} className="fr-col-12 fr-col-md-6">
                    <Card
                      title={proposition.magistratName}
                      desc={
                        <span className="fr-text--sm">
                          {proposition.number && (
                            <span className="fr-mb-1v block">N° {proposition.number}</span>
                          )}
                          <span className="fr-mb-1v block">{proposition.proposedPosition ?? '-'}</span>
                          <span className="block text-(--text-mention-grey)"></span>
                        </span>
                      }
                      linkProps={{
                        to: getObservationDetailsPath({
                          context,
                          sessionId,
                          nominationFileId: proposition.nominationFileId,
                          observationId: proposition.observationId,
                        }),
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
