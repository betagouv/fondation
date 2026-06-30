import Card from '@codegouvfr/react-dsfr/Card';
import * as Sentry from '@sentry/react';
import { useMemo, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { SummaryReaderSelector } from '@/features/summary/components/SummaryReaderSelector';
import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { useArchivedSession } from '@/shared/context/archived-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { useSummaryQuery } from '@queries/summary.queries';

import { MagistratSummaryButton } from './MagistratSummaryButton';

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
          <SummaryReaderSelector
            className="min-h-9! px-3.5! py-1.5! text-[0.9375rem]!"
            priority="secondary"
            rounded={false}
            size="small"
            withCount={false}
          />
        }
      >
        <SummaryPreviewCard
          content={data.summary.content}
          link={link}
          name={nominationFile.content.nomMagistrat}
          readers={data.summary.readers}
        />
      </SummarySection>
    </SummaryContext>
  );
}

function SummarySection(props: { action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-2">
        <h3 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage defaultMessage="Synthèse" />
        </h3>
        {props.action}
      </div>
      {props.children}
    </div>
  );
}

function SummaryPreviewCard(props: {
  name: string | null;
  content: string;
  readers: readonly { firstName: string; lastName: string }[];
  link: string;
}) {
  const intl = useIntl();
  const excerpt = useMemo(() => {
    const el = document.createElement('div');
    el.innerHTML = props.content;
    return (el.textContent ?? '').trim();
  }, [props.content]);

  const sharedWith = useMemo(() => {
    if (props.readers.length === 0) return null;
    const names = props.readers.map(
      (reader) =>
        `${capitalize(reader.firstName.toLowerCase())} ${capitalize(reader.lastName.toLowerCase())}`,
    );
    return new Intl.ListFormat('fr', { type: 'conjunction' }).format(names);
  }, [props.readers]);

  return (
    <Card
      desc={excerpt ? <span className="line-clamp-2 text-base">{excerpt}</span> : undefined}
      enlargeLink
      linkProps={{ to: props.link }}
      size="small"
      start={
        sharedWith ? (
          <p className="fr-mb-2v flex items-center gap-2 text-sm text-(--text-mention-grey)">
            <span aria-hidden className="fr-icon-user-star-line fr-icon--sm" />
            <FormattedMessage defaultMessage="Partagée à {sharedWith}" values={{ sharedWith }} />
          </p>
        ) : undefined
      }
      title={intl.formatMessage({ defaultMessage: 'Proposition de {name}' }, { name: props.name ?? '' })}
    />
  );
}
