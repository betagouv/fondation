import type { MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function MagistratLink(props: {
  /** still holder in LOLFI while their position is vacant, until LOLFI gives it a new one */
  isFormerHolder?: boolean;
  magistrat: { id: string; name: string };
  onClick: (event: MouseEvent, magistratId: string) => void;
}) {
  const { id, name } = props.magistrat;

  // the link sits in an inline span: a flex item turns into a block, which draws the DSFR underline under its
  // last line only
  return (
    <span className="flex flex-col items-start">
      <span className="leading-6">
        <Link
          className="fr-link fr-link--sm fr-icon-account-circle-fill fr-link--icon-left box-decoration-clone"
          onClick={(event) => props.onClick(event, id)}
          to={generatePath(ROUTE_PATHS.SG.MAGISTRAT_DETAILS, { magistratId: id })}
        >
          {name}
        </Link>
      </span>
      {props.isFormerHolder && (
        <span className="text-xs leading-5 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="N'occupe plus le poste" />
        </span>
      )}
    </span>
  );
}
