import Button from '@codegouvfr/react-dsfr/Button';
import * as Sentry from '@sentry/react';
import { useMemo, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryReaderSelector } from '@/features/summary/components/SummaryReaderSelector';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { useArchivedSession } from '@/shared/context/archived-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useGenerateSummaryAttachmentPublicUrlMutation, useSummaryQuery } from '@queries/summary.queries';

import { MagistratSummaryButton } from './MagistratSummaryButton';
import { toPlainText } from './summary-text';

export function MagistratSummary(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <SummarySection>
          <p className="fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="La synthèse n'a pas pu être affichée." />
          </p>
        </SummarySection>
      }
    >
      <MagistratSummaryContent {...props} />
    </Sentry.ErrorBoundary>
  );
}

function MagistratSummaryContent(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const isSg = useIsSg();
  const { isArchived } = useArchivedSession();
  const { summary } = props.nominationFile;

  if (summary?.canRead) {
    return <ReadableSummary nominationFile={props.nominationFile} sessionId={props.sessionId} />;
  }

  const canCreate = !isArchived && !summary && isSg;
  if (!canCreate) return null;

  return (
    <SummarySection action={<MagistratSummaryButton {...props} />}>
      <p className="fr-mb-0 text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune synthèse rédigée" />
      </p>
    </SummarySection>
  );
}

function ReadableSummary(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { user } = useUser();
  const isSg = useIsSg();
  const { nominationFile, sessionId } = props;
  const { data, isLoading } = useSummaryQuery({ sessionId, nominationFileId: nominationFile.id });

  if (isLoading) {
    return (
      <SummarySection>
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Chargement…" />
        </p>
      </SummarySection>
    );
  }

  if (!data) {
    return (
      <SummarySection>
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="La synthèse n'a pas pu être chargée." />
        </p>
      </SummarySection>
    );
  }

  const canWriteSummary = !!user?.id && (data.summary.author ? user.id === data.summary.author.id : isSg);

  const link = ROUTE_PATHS.SUMMARY.replace(':sessionId', sessionId).replace(':fileId', nominationFile.id);

  return (
    <SummaryContext
      value={{
        sections: [],
        showSection: () => {},
        sessionId,
        nominationFileId: nominationFile.id,
        canWriteSummary,
        summary: data,
      }}
    >
      <SummarySection
        action={
          <div className="flex shrink-0 items-center gap-2">
            <SummaryReaderSelector
              className="btn-compact"
              priority="tertiary"
              rounded={false}
              size="small"
              withCount={false}
            />
            <Button className="btn-compact" linkProps={{ to: link }} priority="secondary" size="small">
              {canWriteSummary ? (
                <FormattedMessage defaultMessage="Modifier" />
              ) : (
                <FormattedMessage defaultMessage="Ouvrir" />
              )}
            </Button>
          </div>
        }
        mention={<SharedWithMention count={data.summary.readers.length} />}
      >
        <SummaryText
          attachments={data.summary.attachments}
          content={data.summary.content}
          nominationFileId={nominationFile.id}
          sessionId={sessionId}
        />
      </SummarySection>
    </SummaryContext>
  );
}

function SummarySection(props: { action?: ReactNode; children: ReactNode; mention?: ReactNode }) {
  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="fr-mb-0 text-xl font-semibold">
            <FormattedMessage defaultMessage="Synthèse" />
          </h3>
          {props.mention}
        </div>
        {props.action}
      </div>
      {props.children}
    </div>
  );
}

function SharedWithMention(props: { count: number }) {
  if (props.count === 0) return null;

  return (
    <p className="fr-mb-0 flex items-center gap-2 text-sm-plus text-(--text-mention-grey)">
      <span aria-hidden className="fr-icon-user-star-line fr-icon--sm" />
      <FormattedMessage
        defaultMessage="Partagée à {count, plural, one {# membre} other {# membres}}"
        values={{ count: props.count }}
      />
    </p>
  );
}

function SummaryText(props: {
  attachments: readonly { id: string; name: string; type: string }[];
  content: string;
  nominationFileId: string;
  sessionId: string;
}) {
  const text = useMemo(() => toPlainText(props.content), [props.content]);

  return (
    <div className="flex flex-col gap-6">
      {text ? (
        <p className="fr-mb-0 line-clamp-6 leading-7 whitespace-pre-line text-(--text-default-grey)">
          {text}
        </p>
      ) : (
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucune synthèse rédigée" />
        </p>
      )}

      {props.attachments.length > 0 && (
        <SummaryAttachments
          attachments={props.attachments}
          nominationFileId={props.nominationFileId}
          sessionId={props.sessionId}
        />
      )}
    </div>
  );
}

function attachmentIcon(type: string) {
  if (type === 'application/pdf') return 'ri-file-pdf-2-line' as const;
  if (type.startsWith('image/')) return 'ri-file-image-line' as const;
  return 'ri-file-line' as const;
}

function SummaryAttachments(props: {
  attachments: readonly { id: string; name: string; type: string }[];
  nominationFileId: string;
  sessionId: string;
}) {
  const { mutate: openAttachment, isPending } = useGenerateSummaryAttachmentPublicUrlMutation();
  const { nominationFileId, sessionId } = props;

  return (
    <div>
      <div className="fr-mb-2v fr-text--sm fr-text--bold">
        <FormattedMessage
          defaultMessage="{count, plural, one {Pièce jointe de la synthèse :} other {Pièces jointes de la synthèse :}}"
          values={{ count: props.attachments.length }}
        />
      </div>
      <ul className="fr-raw-list flex flex-col items-start">
        {props.attachments.map(({ id, name, type }) => (
          <li key={id}>
            <Button
              className="px-0!"
              disabled={isPending}
              iconId={attachmentIcon(type)}
              onClick={() => openAttachment({ sessionId, nominationFileId, fileId: id })}
              priority="tertiary no outline"
              size="small"
            >
              {name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
