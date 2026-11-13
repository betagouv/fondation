import type { MouseEvent } from 'react';
import { generatePath, Link } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function MagistratLink(props: {
  magistrat: { id: string; name: string };
  onClick: (event: MouseEvent, magistratId: string) => void;
}) {
  const { id, name } = props.magistrat;

  return (
    // a flex item turns into a block, which draws the DSFR underline under its last line only
    <span className="leading-6">
      <Link
        className="fr-link fr-link--sm box-decoration-clone"
        onClick={(event) => props.onClick(event, id)}
        to={generatePath(ROUTE_PATHS.SG.MAGISTRAT_DETAILS, { magistratId: id })}
      >
        {name}
      </Link>
    </span>
  );
}
