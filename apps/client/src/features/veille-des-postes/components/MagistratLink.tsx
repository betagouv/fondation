import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function MagistratLink(props: {
  commentPreview: string | null;
  /** LOLFI keeps them as holder of a vacant position until it names a new one */
  isFormerHolder?: boolean;
  magistrat: { id: string; name: string };
  onClick: (event: MouseEvent, magistratId: string) => void;
}) {
  const { id, name } = props.magistrat;

  // the link sits in a block of its own: as a flex item it would draw the DSFR underline under its last line
  // only. Divs because the tooltip adds one next to its icon
  return (
    <div className="flex flex-col items-start">
      <div className="leading-6">
        <Link
          className="fr-link fr-link--sm fr-icon-account-circle-fill fr-link--icon-left box-decoration-clone"
          onClick={(event) => props.onClick(event, id)}
          to={generatePath(ROUTE_PATHS.SG.MAGISTRAT_DETAILS, { magistratId: id })}
        >
          {name}
        </Link>
        <CommentPreviewIcon className="fr-ml-1v" commentPreview={props.commentPreview} />
      </div>
      {props.isFormerHolder && (
        <span className="text-xs leading-5 text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="N'occupe plus le poste" />
        </span>
      )}
    </div>
  );
}

export function CommentPreviewIcon(props: { className?: string; commentPreview: string | null }) {
  const { formatMessage } = useIntl();

  if (props.commentPreview === null) return null;

  return (
    <Tooltip
      focusable
      label={<span className="line-clamp-6 whitespace-pre-line">{props.commentPreview}</span>}
    >
      <i
        aria-label={formatMessage({ defaultMessage: 'Commentaire' })}
        className={clsx(
          'ri-message-3-line fr-icon--sm text-(--text-action-high-blue-france)',
          props.className,
        )}
        role="img"
      />
    </Tooltip>
  );
}
