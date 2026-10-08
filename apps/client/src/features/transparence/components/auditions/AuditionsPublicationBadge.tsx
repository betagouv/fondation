import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { Tooltip } from '@/shared/ui/tooltip';
import { useLastAuditionsPublicationQuery } from '@queries/auditions.queries';
import { useUser } from '@queries/auth.queries';

export function AuditionsPublicationBadge(props: { sessionId: string }) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { data: publication } = useLastAuditionsPublicationQuery({ sessionId: props.sessionId });

  if (!publication) return null;
  const { lastPublished, status } = publication;

  const badge = (
    <Badge noIcon severity={status === 'PUBLISHED' ? 'success' : 'warning'}>
      {status === 'PUBLISHED' ? (
        <FormattedMessage defaultMessage="Publié aux membres" />
      ) : status === 'UNPUBLISHED_CHANGES' ? (
        <FormattedMessage defaultMessage="Modifications non publiées" />
      ) : (
        <FormattedMessage defaultMessage="Non publié aux membres" />
      )}
    </Badge>
  );
  if (!lastPublished) return badge;

  const values = {
    ...dateAndTime(lastPublished.at),
    name: lastPublished.by?.name,
    who: !lastPublished.by ? 'nobody' : lastPublished.by.id === user?.id ? 'self' : 'someone',
  };

  return (
    <Tooltip
      focusable
      label={
        status === 'UNPUBLISHED_CHANGES' ? (
          <FormattedMessage
            defaultMessage="La dernière publication des auditions date du {date} à {time}{who, select, self { par vous} someone { par {name}} other {}}. Des modifications ont été faites depuis et ne sont pas encore publiées."
            values={values}
          />
        ) : (
          <FormattedMessage
            defaultMessage="Les auditions ont été publiées le {date} à {time}{who, select, self { par vous} someone { par {name}} other {}}"
            values={values}
          />
        )
      }
    >
      {badge}
    </Tooltip>
  );
}
