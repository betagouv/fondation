import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { Tooltip } from '@/shared/ui/tooltip';
import { useUser } from '@queries/auth.queries';
import {
  useDetailAffectationHistoryQuery,
  useDetailedNominationSessionAffectationsVersionQuery,
} from '@queries/nomination-sessions.queries';

export function AffectationVersionStatusBadge(props: { sessionId: string }) {
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(props.sessionId);

  const version = affectationsVersion?.version ?? 0;
  const isPublished =
    !!affectationsVersion && 'status' in affectationsVersion && affectationsVersion.status === 'PUBLIEE';

  return (
    <Tooltip focusable label={<AffectationHistory sessionId={props.sessionId} />}>
      <Badge noIcon severity={isPublished ? 'success' : 'warning'}>
        {isPublished ? (
          <FormattedMessage
            defaultMessage="{version, select, 1 {Publiée} other {V{version} publiée}}"
            values={{ version }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="{version, select, 0 {Non publiée} 1 {Non publiée} other {V{version} non publiée}}"
            values={{ version }}
          />
        )}
      </Badge>
    </Tooltip>
  );
}

type Writer = { id: string; name: string } | null;

/** when the members' version was published and by whom, and who reopened the affectations since */
function AffectationHistory(props: { sessionId: string }) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { data: history } = useDetailAffectationHistoryQuery(props.sessionId);

  if (!history) return null;
  const { lastPublished, pending } = history;

  const who = (writer: Writer) => (!writer ? 'nobody' : writer.id === user?.id ? 'self' : 'someone');
  // the number only tells something once a second version exists
  const numbered = Math.max(lastPublished?.version ?? 0, pending?.version ?? 0) > 1 ? 'yes' : 'no';
  const values = (at: string, writer: Writer, version: number) => ({
    ...dateAndTime(at),
    name: writer?.name,
    numbered,
    version,
    who: who(writer),
  });

  return (
    <span className="flex flex-col gap-1">
      {lastPublished && (
        <span>
          <FormattedMessage
            defaultMessage="{numbered, select, yes {Les affectations V{version}} other {Les affectations}} ont été publiées le {date} à {time}{who, select, self { par vous} someone { par {name}} other {}}"
            values={values(lastPublished.at, lastPublished.by, lastPublished.version)}
          />
        </span>
      )}
      {pending && (
        <span>
          <FormattedMessage
            defaultMessage="{numbered, select, yes {Les affectations V{version}} other {Les affectations}} {reopened, select, yes {ont été rouvertes} other {sont en cours depuis}} le {date} à {time}{who, select, self { par vous} someone { par {name}} other {}} et ne sont pas encore publiées"
            values={{
              ...values(pending.openedAt, pending.openedBy, pending.version),
              reopened: lastPublished ? 'yes' : 'no',
            }}
          />
        </span>
      )}
    </span>
  );
}
