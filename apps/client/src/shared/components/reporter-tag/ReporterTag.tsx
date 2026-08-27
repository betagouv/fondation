import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import { memberFullName, toInitials } from '@/utils/user.utils';

const currentUserStyle = {
  backgroundColor: colors.options.brownCafeCreme.sun383moon885.active,
  color: colors.decisions.text.inverted.grey.default,
};

export function ReporterTag(props: {
  enableTooltip?: boolean;
  excludedTitle?: string;
  isCurrentUser?: boolean;
  reporter: { firstName: string; lastName: string };
}) {
  const { formatMessage } = useIntl();

  const tag = (
    <Tag
      className={clsx(
        'min-h-7! min-w-11.5 gap-1 py-0! text-[0.8125rem]',
        props.excludedTitle && 'bg-(--background-contrast-warning)! text-(--text-default-warning)!',
      )}
      style={props.isCurrentUser ? currentUserStyle : undefined}
    >
      {props.isCurrentUser ? (
        <i aria-hidden className={clsx(cx('fr-icon-star-fill'), 'before:block before:size-3.5!')} />
      ) : null}
      {props.excludedTitle ? (
        <i aria-hidden className={clsx(cx('fr-icon-error-line'), 'shrink-0 before:block before:size-4!')} />
      ) : null}
      {toInitials(props.reporter)}
    </Tag>
  );

  const label =
    props.excludedTitle ??
    (props.isCurrentUser ? formatMessage({ defaultMessage: 'Vous' }) : memberFullName(props.reporter));

  return props.enableTooltip === false ? tag : <Tooltip label={label}>{tag}</Tooltip>;
}
