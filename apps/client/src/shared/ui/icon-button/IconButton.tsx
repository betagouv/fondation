import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import type { IconClassName } from '@/types/icons.types';

const ICON_BUTTON_CLASS = cx('fr-btn', 'fr-btn--tertiary-no-outline');
const SMALL_CLASS = cx('fr-btn--sm');

export function IconButton({
  iconId,
  label,
  small,
  ...props
}: ComponentProps<'button'> & { iconId: IconClassName; label: string; small?: boolean }) {
  return (
    <Tooltip label={label}>
      <button
        {...props}
        aria-label={label}
        className={clsx(ICON_BUTTON_CLASS, small && SMALL_CLASS, iconId, 'rounded-full')}
        type="button"
      />
    </Tooltip>
  );
}

export function IconLink(props: {
  className?: string;
  disabled?: boolean;
  iconId: IconClassName;
  label: string;
  newTab?: boolean;
  small?: boolean;
  to: LinkProps['to'];
}) {
  if (props.disabled)
    return <IconButton disabled iconId={props.iconId} label={props.label} small={props.small} />;

  return (
    <Tooltip label={props.label}>
      <Link
        aria-label={props.label}
        className={clsx(
          ICON_BUTTON_CLASS,
          props.small && SMALL_CLASS,
          props.iconId,
          'rounded-full',
          props.className,
        )}
        rel={props.newTab ? 'noopener noreferrer' : undefined}
        target={props.newTab ? '_blank' : undefined}
        to={props.to}
      />
    </Tooltip>
  );
}
