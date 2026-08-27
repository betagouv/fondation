import { useIntl } from 'react-intl';

import { IconLink } from '@/shared/ui/icon-button';
import { getMagistratDetailsPath } from '@/utils/route-path.utils';

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
      className={props.className}
      iconId="fr-icon-user-line"
      label={formatMessage({ defaultMessage: 'Vers la fiche magistrat' })}
      small={props.small}
      to={getMagistratDetailsPath({ context: props.context, magistratId: props.magistratId })}
    />
  );
}
