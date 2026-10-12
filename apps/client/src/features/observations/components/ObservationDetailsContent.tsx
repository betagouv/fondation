import Card from '@codegouvfr/react-dsfr/Card';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { DetailsCard, DetailsPageLayout } from '@/shared/ui/details';
import { type FilesUploader, TipTapEditor } from '@/shared/ui/tip-tap-editor';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationAttachmentsCard } from './ObservationAttachmentsCard';
import { ObservationAuditionCard } from './ObservationAuditionCard';
import { ObservationDescription } from './ObservationDescription';
import { ObservationDetailsHeader } from './ObservationDetailsHeader';
import { ObservationIdentityCard } from './ObservationIdentityCard';

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
  const relatedPropositions = observation.relatedPropositions ?? [];

  return (
    <DetailsPageLayout
      alerts={
        <AuditionScheduledBanner
          date={observation.observant.audition?.date ?? null}
          fullWidth
          time={observation.observant.audition?.time ?? null}
        />
      }
      background="greenEmeraude"
      header={
        <ObservationDetailsHeader
          backTo={backTo}
          context={context}
          isArchived={isArchived}
          nominationFileId={nominationFileId}
          observation={observation}
          sessionId={sessionId}
        />
      }
      identity={
        <ObservationIdentityCard
          context={context}
          nominationFileId={nominationFileId}
          observation={observation}
          sessionId={sessionId}
        />
      }
      wideIdentity
    >
      <ObservationAttachmentsCard
        isArchived={isArchived}
        nominationFileId={nominationFileId}
        observation={observation}
        onDownloadFile={onDownloadFile}
        onOpenFile={onOpenFile}
        sessionId={sessionId}
      />

      <ObservationAuditionCard
        isArchived={isArchived}
        nominationFileId={nominationFileId}
        observation={observation}
        sessionId={sessionId}
      />

      {observation.description || (!isArchived && isSg) ? (
        <DetailsCard>
          <ObservationDescription
            isArchived={isArchived}
            nominationFileId={nominationFileId}
            observation={observation}
            sessionId={sessionId}
          />
        </DetailsCard>
      ) : null}

      {context === 'membre' &&
        observation.isMemberReporter &&
        ((!isArchived && onUpdateMemberComment) || (isArchived && observation.memberComment?.comment)) && (
          <DetailsCard>
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
          </DetailsCard>
        )}

      {relatedPropositions.length > 0 && (
        <DetailsCard>
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
                      <span className="block">{proposition.proposedPosition ?? '-'}</span>
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
        </DetailsCard>
      )}
    </DetailsPageLayout>
  );
}
