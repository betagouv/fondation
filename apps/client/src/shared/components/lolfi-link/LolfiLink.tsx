import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { IconLink } from '@/shared/ui/icon-button';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

type LolfiTarget = { href: string } | { name?: string | null; nominationFileId: string; sessionId: string };

function lolfiPath(target: Exclude<LolfiTarget, { href: string }>) {
  return {
    pathname: generatePath(ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI, {
      sessionId: target.sessionId,
      fileId: target.nominationFileId,
    }),
    search: target.name ? '?' + new URLSearchParams({ name: target.name }).toString() : undefined,
  };
}

export function LolfiLink(props: { className?: string; small?: boolean } & LolfiTarget) {
  const { formatMessage } = useIntl();

  return (
    <IconLink
      className={props.className}
      iconId="fr-icon-external-link-line"
      label={formatMessage({ defaultMessage: 'Vers LOLFI' })}
      newTab
      small={props.small}
      to={'href' in props ? props.href : lolfiPath(props)}
    />
  );
}
