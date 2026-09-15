import Button from '@codegouvfr/react-dsfr/Button';
import * as Sentry from '@sentry/react';
import { useMemo, useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryReaderSelector } from '@/features/summary/components/SummaryReaderSelector';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { useOpenSummaryAttachment } from '@/features/summary/hooks/useOpenSummaryAttachment';
import { useArchivedSession } from '@/shared/context/archived-session';
import { ExpandableText } from '@/shared/ui/expandable-text';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useUser } from '@queries/auth.queries';
import { useSummaryQuery } from '@queries/summary.queries';

import { containsImage, toPlainText } from './summary-text';
import { SummaryButton } from './SummaryButton';

export type SummaryTarget = {
  canRead: boolean;
  hasSummary: boolean;
  headingLevel?: 2 | 3;
  nominationFileId: string;
  sessionId: string;
  withOpenLink?: boolean;
};

export function Summary(props: SummaryTarget) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <SummarySection headingLevel={props.headingLevel}>
          <p className="fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="La synthèse n'a pas pu être affichée." />
          </p>
        </SummarySection>
      }
    >
      <SummaryContent {...props} />
    </Sentry.ErrorBoundary>
  );
}

function SummaryContent(props: SummaryTarget) {
  const isSg = useIsSg();
  const { isArchived } = useArchivedSession();

  if (props.canRead) return <ReadableSummary {...props} />;

  const canCreate = !isArchived && !props.hasSummary && isSg;
  if (!canCreate) return null;

  return (
    <SummarySection action={<SummaryButton {...props} />} headingLevel={props.headingLevel}>
      <p className="fr-mb-0 text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune synthèse rédigée" />
      </p>
    </SummarySection>
  );
}

function ReadableSummary(props: SummaryTarget) {
  const { user } = useUser();
  const isSg = useIsSg();
  const { nominationFileId, sessionId } = props;
  const { data, isLoading } = useSummaryQuery({ sessionId, nominationFileId });

  if (isLoading) {
    return (
      <SummarySection headingLevel={props.headingLevel}>
        <p className="fr-mb-0">
          <FormattedMessage defaultMessage="Chargement…" />
        </p>
      </SummarySection>
    );
  }

  if (!data) {
    return (
      <SummarySection headingLevel={props.headingLevel}>
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="La synthèse n'a pas pu être chargée." />
        </p>
      </SummarySection>
    );
  }

  const canWriteSummary = !!user?.id && (data.summary.author ? user.id === data.summary.author.id : isSg);

  const link = ROUTE_PATHS.SUMMARY.replace(':sessionId', sessionId).replace(':fileId', nominationFileId);

  return (
    <SummaryContext
      value={{
        sections: [],
        showSection: () => {},
        sessionId,
        nominationFileId,
        canWriteSummary,
        summary: data,
      }}
    >
      <SummarySection
        action={
          <div className="flex shrink-0 items-center gap-2">
            <SummaryReaderSelector
              className="btn-compact"
              iconId="fr-icon-lock-line"
              priority="tertiary"
              rounded={false}
              size="small"
              withCount={false}
            />
            {props.withOpenLink && canWriteSummary && (
              <Button
                className="btn-compact"
                iconId="fr-icon-arrow-right-line"
                iconPosition="right"
                linkProps={{ to: link }}
                priority="secondary"
                size="small"
              >
                <FormattedMessage defaultMessage="Ouvrir" />
              </Button>
            )}
          </div>
        }
        headingLevel={props.headingLevel}
        mention={canWriteSummary && <SharedWithMention count={data.summary.readers.length} />}
      >
        <SummaryText
          attachments={data.summary.attachments}
          content={data.summary.content}
          nominationFileId={nominationFileId}
          sessionId={sessionId}
        />
      </SummarySection>
    </SummaryContext>
  );
}

function SummarySection(props: {
  action?: ReactNode;
  children: ReactNode;
  headingLevel?: 2 | 3;
  mention?: ReactNode;
}) {
  const Heading = props.headingLevel === 2 ? 'h2' : 'h3';
  const headingClass = props.headingLevel === 2 ? 'fr-h6 fr-mb-0' : 'fr-mb-0 text-xl font-semibold';

  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Heading className={headingClass}>
            <FormattedMessage defaultMessage="Synthèse" />
          </Heading>
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
    <p className="fr-text--xs fr-mb-0 flex items-center gap-1 text-(--text-mention-grey)">
      <span aria-hidden className="fr-icon-user-star-line fr-icon--sm [&::before]:[--icon-size:0.875rem]" />
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
    <div className="flex flex-col gap-3">
      {text ? (
        <ExpandableText className="leading-7 text-(--text-default-grey)" text={text} />
      ) : containsImage(props.content) ? (
        <p className="fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Des images sont présentes dans la synthèse" />
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

function SummaryAttachments(props: {
  attachments: readonly { id: string; name: string; type: string }[];
  nominationFileId: string;
  sessionId: string;
}) {
  const { isPending, open: openAttachment } = useOpenSummaryAttachment();
  const { nominationFileId, sessionId } = props;
  const [expanded, setExpanded] = useState(false);
  const count = props.attachments.length;
  const panelId = `summary-attachments-${nominationFileId}`;

  return (
    <div>
      <Button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="px-0! [&::after]:ml-1!"
        iconId={expanded ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
        iconPosition="right"
        onClick={() => setExpanded((value) => !value)}
        priority="tertiary no outline"
        size="small"
      >
        <FormattedMessage
          defaultMessage="{count, plural, one {Voir la pièce jointe de la synthèse} other {Voir les # pièces jointes de la synthèse}}"
          values={{ count }}
        />
      </Button>
      {expanded && (
        <ul className="fr-raw-list fr-mt-1v flex flex-col items-start" id={panelId}>
          {props.attachments.map(({ id, name }) => (
            <li key={id}>
              <Button
                className="px-0! underline underline-offset-3 before:no-underline [&::before]:mr-1!"
                disabled={isPending}
                iconId="ri-file-text-line"
                onClick={() => openAttachment({ fileId: id, name, nominationFileId, sessionId })}
                priority="tertiary no outline"
                size="small"
              >
                {name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
