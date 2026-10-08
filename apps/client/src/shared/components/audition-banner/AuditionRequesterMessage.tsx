import { FormattedMessage } from 'react-intl';

import { useNominationFileAuditionHistoryQuery } from '@queries/auditions.queries';

export function AuditionRequesterMessage(props: { nominationFileId: string; sessionId: string }) {
  const { data: history } = useNominationFileAuditionHistoryQuery(props);
  const requester = history?.requested?.by?.name;

  return requester ? (
    <FormattedMessage defaultMessage="Une audition a été demandée par {name}" values={{ name: requester }} />
  ) : (
    <FormattedMessage defaultMessage="Une audition a été demandée par le secrétariat général" />
  );
}
