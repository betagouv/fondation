import Card from '@codegouvfr/react-dsfr/Card';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { BiographyList } from '@/shared/components/biography-list';
import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { FileList, FileListItem } from '@/shared/ui/file-list';
import { type FilesUploader, TipTapEditor } from '@/shared/ui/tip-tap-editor';
import { formatDateOnly } from '@/utils/date-only.util';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { fullNameUpperCase } from '@/utils/user.utils';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationDescription } from './ObservationDescription';
import { ObservationFollowUpSelector } from './ObservationFollowUpSelector';

type ObservationDetailsContentProps = {
  backTo: string;
  context: 'sg' | 'membre';
  isArchived: boolean;
  nominationFileId: string;
  observation: GetObservationDetailsResponseDto;
  observationId: string;
  onDownloadFile: (file: { id: string; name: string }) => void;
  onOpenFile: (fileId: string) => void;
  onUpdateMemberComment?: (comment: string) => void;
  sessionId: string;
  uploadFiles?: FilesUploader;
};

export function ObservationDetailsContent({
  backTo,
  context,
  isArchived,
  nominationFileId,
  observation,
  onDownloadFile,
  onOpenFile,
  onUpdateMemberComment,
  sessionId,
  uploadFiles,
}: ObservationDetailsContentProps) {
  const isSg = useIsSg();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const hasPreviousPage = location.key !== 'default';
    if (hasPreviousPage) {
      event.preventDefault();
      navigate(-1);
    }
  };
  const observant = observation.observant;
  const candidacy = observant.candidacy;
  const relatedPropositions = observation.relatedPropositions ?? [];

  return (
    <div className="fr-p-8v bg-(--background-default-grey)">
      <div className="fr-mb-8v">
        <Link className="fr-link fr-link--icon-left fr-icon-arrow-left-line" onClick={goBack} to={backTo}>
          <FormattedMessage defaultMessage="Retour" />
        </Link>
      </div>

      <h1 className="fr-h2 fr-mb-8v flex items-center justify-between">
        <span>
          <FormattedMessage defaultMessage="Fiche observation" />
        </span>
        <ObservationFollowUpSelector
          comment={observation.followUpComment}
          followUp={observation.followUp}
          isArchived={isArchived}
          nominationFileId={nominationFileId}
          observationId={observation.id}
          sessionId={sessionId}
        />
      </h1>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-lg-8">
          <section className="fr-mb-8v">
            <h2 className="fr-h4">
              <FormattedMessage defaultMessage="Rappel" />
            </h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">
                  <FormattedMessage defaultMessage="Date de réception :" />
                </dt>
                <dd className="fr-col-8 fr-m-0">{formatDateOnly(observation.receptionDate)}</dd>
              </div>
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">
                  <FormattedMessage defaultMessage="Magistrat observé :" />
                </dt>
                <dd className="fr-col-8 fr-m-0">
                  <TitleNameIcons name={observation.observedMagistrat?.name ?? null}>
                    <DetailsLink
                      context={context}
                      magistratId={observation.observedMagistrat?.detectedMagistratId}
                      small
                    />
                    <LolfiLink
                      name={observation.observedMagistrat?.name}
                      nominationFileId={nominationFileId}
                      sessionId={sessionId}
                      small
                    />
                  </TitleNameIcons>
                </dd>
              </div>
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">
                  <FormattedMessage defaultMessage="Poste observé :" />
                </dt>
                <dd className="fr-col-8 fr-m-0">{observation.observedMagistrat?.proposedPosition ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section className="fr-mb-8v">
            <h2 className="fr-h4">
              <FormattedMessage defaultMessage="Magistrat observant" />
            </h2>
            <dl className="fr-mb-0">
              <div className="fr-grid-row fr-mb-4v">
                <dt className="fr-col-4 fr-text--bold">
                  <FormattedMessage defaultMessage="NOM Prénom :" />
                </dt>
                <dd className="fr-col-8 fr-m-0">
                  <TitleNameIcons name={fullNameUpperCase(observant)}>
                    <DetailsLink context={context} magistratId={observant.id} small />
                    <LolfiLink href={observant.externalUrl} small />
                  </TitleNameIcons>
                </dd>
              </div>
              {candidacy && (
                <>
                  {candidacy.desiredPosition && (
                    <div className="fr-grid-row fr-mb-4v">
                      <dt className="fr-col-4 fr-text--bold">
                        <FormattedMessage defaultMessage="Poste souhaité :" />
                      </dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.desiredPosition}</dd>
                    </div>
                  )}
                  {candidacy.rank && (
                    <div className="fr-grid-row fr-mb-4v">
                      <dt className="fr-col-4 fr-text--bold">
                        <FormattedMessage defaultMessage="Rang :" />
                      </dt>
                      <dd className="fr-col-8 fr-m-0">{candidacy.rank}</dd>
                    </div>
                  )}
                </>
              )}
              {observant.biography && (
                <div className="fr-grid-row fr-mb-4v">
                  <dt className="fr-col-4 fr-text--bold">
                    <FormattedMessage defaultMessage="Biographie :" />
                  </dt>
                  <dd className="fr-col-8 fr-m-0 whitespace-pre-wrap">
                    <BiographyList biography={observant.biography} />
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
                  <FormattedMessage defaultMessage="Mon commentaire" />
                </h2>
                <TipTapEditor
                  ariaLabelledby="member-comment-label"
                  onChange={onUpdateMemberComment}
                  readOnly={isArchived}
                  uploadFiles={uploadFiles}
                  value={observation.memberComment?.comment ?? ''}
                />
              </section>
            )}

          {observation.description || (!isArchived && isSg) ? (
            <section className="fr-mb-8v">
              <ObservationDescription
                isArchived={isArchived}
                nominationFileId={nominationFileId}
                observation={observation}
                sessionId={sessionId}
              />
            </section>
          ) : null}

          <section className="fr-mb-8v">
            <h2 className="fr-h4">
              <FormattedMessage defaultMessage="Pièce(s) jointe(s)" />
            </h2>
            {observation.files.length === 0 ? (
              <p className="fr-text--sm text-(--text-mention-grey)">
                <FormattedMessage defaultMessage="Aucune pièce jointe" />
              </p>
            ) : (
              <FileList>
                {observation.files.map((file) => (
                  <FileListItem
                    addedAt={file.addedAt}
                    addedBy={file.addedBy}
                    key={file.id}
                    name={file.name}
                    onDownload={() => onDownloadFile(file)}
                    onOpen={() => onOpenFile(file.id)}
                    size={file.size}
                  />
                ))}
              </FileList>
            )}
          </section>

          {relatedPropositions.length > 0 && (
            <section className="fr-mb-8v">
              <h2 className="fr-h4">
                <FormattedMessage defaultMessage="Propositions liées" />
              </h2>
              <p className="fr-text--sm fr-mb-4v">
                <FormattedMessage defaultMessage="Autres propositions sur lesquelles ce magistrat a formulé une observation" />
              </p>
              <div className="fr-grid-row fr-grid-row--gutters">
                {relatedPropositions.map((proposition) => (
                  <div className="fr-col-12 fr-col-md-6" key={proposition.observationId}>
                    <Card
                      desc={
                        <span className="fr-text--sm">
                          {proposition.number && (
                            <span className="fr-mb-1v block">
                              <FormattedMessage
                                defaultMessage="N° {number}"
                                values={{ number: proposition.number }}
                              />
                            </span>
                          )}
                          <span className="fr-mb-1v block">{proposition.proposedPosition ?? '-'}</span>
                          <span className="block text-(--text-mention-grey)"></span>
                        </span>
                      }
                      enlargeLink
                      linkProps={{
                        to: getObservationDetailsPath({
                          context,
                          nominationFileId: proposition.nominationFileId,
                          observationId: proposition.observationId,
                          sessionId,
                        }),
                      }}
                      size="small"
                      title={proposition.magistratName}
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
