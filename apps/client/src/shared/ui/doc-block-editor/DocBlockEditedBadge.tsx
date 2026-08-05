import Badge from '@codegouvfr/react-dsfr/Badge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

export function DocBlockEditedBadge() {
  return (
    <Badge
      small
      noIcon
      className={clsx(
        'bg-[rgb(0_0_0/0.04)] text-(--text-mention-grey) before:content-[""]',
        cx('ri-pen-nib-fill'),
      )}
    >
      <FormattedMessage defaultMessage="modifié par vous" />
    </Badge>
  );
}
