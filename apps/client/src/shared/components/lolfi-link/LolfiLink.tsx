import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

type LolfiTarget = { href: string } | { sessionId: string; nominationFileId: string; name?: string | null };

export function LolfiLink(props: { className?: string; small?: boolean } & LolfiTarget) {
  const { formatMessage } = useIntl();
  const label = formatMessage({ defaultMessage: 'Vers LOLFI' });

  const className = clsx(
    'fr-btn fr-btn--tertiary-no-outline fr-icon-external-link-line rounded-full',
    props.small && 'fr-btn--sm',
    props.className,
  );

  return (
    <Tooltip kind="hover" title={label}>
      {'href' in props ? (
        <a
          aria-label={label}
          className={className}
          href={props.href}
          rel="noopener external noreferrer"
          target="_blank"
        />
      ) : (
        <Link
          aria-label={label}
          className={className}
          target="_blank"
          to={{
            pathname: generatePath(ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI, {
              sessionId: props.sessionId,
              fileId: props.nominationFileId,
            }),
            search: props.name ? '?' + new URLSearchParams({ name: props.name }).toString() : undefined,
          }}
        />
      )}
    </Tooltip>
  );
}
