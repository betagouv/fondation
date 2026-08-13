import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import { Tooltip } from '@/shared/ui/tooltip';
import { memberFullName, toInitials } from '@/utils/user.utils';

const currentUserStyle = {
  backgroundColor: colors.options.brownCafeCreme.sun383moon885.active,
  color: colors.decisions.text.inverted.grey.default,
};

export function ReporterTag(props: {
  enableTooltip?: boolean;
  icon?: ReactNode;
  isCurrentUser?: boolean;
  reporter: { firstName: string; lastName: string };
}) {
  const tag = (
    <Tag
      className="min-h-7! min-w-11.5 gap-1 py-0! text-[0.8125rem]"
      style={props.isCurrentUser ? currentUserStyle : undefined}
    >
      {props.isCurrentUser ? (
        <i aria-hidden className={clsx(cx('fr-icon-star-fill'), 'fr-icon--sm')} />
      ) : null}
      {props.icon}
      {toInitials(props.reporter)}
    </Tag>
  );

  return props.enableTooltip === false ? (
    tag
  ) : (
    <Tooltip label={memberFullName(props.reporter)}>{tag}</Tooltip>
  );
}
