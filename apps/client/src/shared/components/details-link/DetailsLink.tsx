import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { getMagistratDetailsPath } from '@/utils/route-path.utils';

export function DetailsLink(props: {
  className?: string;
  context: 'sg' | 'membre';
  magistratId: string | null | undefined;
  small?: boolean;
}) {
  const { formatMessage } = useIntl();

  if (!props.magistratId) return null;

  const label = formatMessage({ defaultMessage: 'Fiche détails du magistrat' });

  return (
    <Tooltip kind="hover" title={label}>
      <Link
        aria-label={label}
        className={clsx(
          'fr-btn fr-btn--tertiary-no-outline fr-icon-user-line rounded-full',
          props.small && 'fr-btn--sm',
          props.className,
        )}
        to={getMagistratDetailsPath({ context: props.context, magistratId: props.magistratId })}
      />
    </Tooltip>
  );
}
