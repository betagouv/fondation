import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { IconLink } from '@/shared/ui/icon-button';
import { getMagistratDetailsPath } from '@/utils/route-path.utils';

const ICON_SIZE_CLASS = '[&::before]:[--icon-size:1.15rem]';

export function DetailsLink(props: {
  className?: string;
  context: 'sg' | 'membre';
  magistratId: string | null | undefined;
  small?: boolean;
}) {
  const { formatMessage } = useIntl();

  if (!props.magistratId) return null;

  return (
    <IconLink
      className={clsx(props.className, props.small && ICON_SIZE_CLASS)}
      iconId="fr-icon-account-circle-line"
      label={formatMessage({ defaultMessage: 'Vers la fiche magistrat' })}
      small={props.small}
      to={getMagistratDetailsPath({ context: props.context, magistratId: props.magistratId })}
    />
  );
}
