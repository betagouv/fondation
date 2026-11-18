import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';

export type CommentChange = { at: string; by: { id: string; name: string } | null };

export function CommentLastChange(props: CommentChange) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();

  return (
    <p className="fr-mb-0 text-xs text-(--text-mention-grey)">
      <FormattedMessage
        defaultMessage="Modifié le {date} à {time}{who, select, self { par vous} someone { par {author}} other {}}"
        values={{
          author: props.by?.name,
          ...dateAndTime(props.at),
          who: whoWrote({ currentUserId: user?.id, writer: props.by }),
        }}
      />
    </p>
  );
}
