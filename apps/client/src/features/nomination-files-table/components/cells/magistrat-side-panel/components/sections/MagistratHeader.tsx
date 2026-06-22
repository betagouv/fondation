import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { LolfiMagistratLink } from '@/shared/components/LolfiMagistratLink';
import { PriorityBadgeList } from '@/shared/components/priorities/PriorityBadge';
import { toFullName } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratSummaryButton } from './MagistratSummaryButton';

export function MagistratHeader(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const isSg = useIsSgNavigation();
  const { user } = useUser();
  const { nomMagistrat } = nominationFile.content;

  return (
    <div
      className={clsx(
        '-mx-6 -mt-6 flex flex-col gap-6 px-6 pt-6 pb-4',
        isSg ? 'bg-(--background-alt-blue-france)' : 'bg-(--background-action-low-brown-cafe-creme)',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="fr-h3 fr-mb-0 text-(--text-title-blue-france)">
            {nomMagistrat}
            <LolfiMagistratLink
              name={nomMagistrat}
              nominationFileId={nominationFile.id}
              sessionId={sessionId}
              small
            />
          </h2>
        </div>
        <MagistratSummaryButton nominationFile={nominationFile} sessionId={sessionId} />
      </div>
      <ReporterStatus currentUserId={user?.id} reporters={nominationFile.reporters} />
      <PriorityBadgeList priorities={nominationFile.priorities} />
    </div>
  );
}

type Reporter = { id: string; firstName: string; lastName: string };

function ReporterStatus(props: { currentUserId: string | undefined; reporters: readonly Reporter[] }) {
  const { currentUserId, reporters } = props;
  if (reporters.length === 0) return null;

  const isReporter = reporters.some((reporter) => reporter.id === currentUserId);

  if (!isReporter) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
        <FormattedMessage
          defaultMessage="{count, plural, one {Rapporteur} other {Rapporteurs}} :"
          values={{ count: reporters.length }}
        />
        {reporters.map((reporter) => (
          <Tag
            className="bg-(--background-default-grey)! text-(--text-action-high-blue-france)!"
            key={reporter.id}
          >
            {toFullName(reporter)}
          </Tag>
        ))}
      </div>
    );
  }

  const coReporters = reporters.filter((reporter) => reporter.id !== currentUserId);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-base/6 text-(--text-default-grey)">
      <span className="font-bold">
        <FormattedMessage defaultMessage="Vous êtes rapporteur" />
      </span>
      {coReporters.length > 0 && <FormattedMessage defaultMessage="avec" />}
      {coReporters.map((reporter) => (
        <Tag
          className="bg-(--background-default-grey)! text-(--text-action-high-blue-france)!"
          key={reporter.id}
        >
          {toFullName(reporter)}
        </Tag>
      ))}
    </div>
  );
}
