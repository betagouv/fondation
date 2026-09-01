import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { ComponentProps } from 'react';

import { Tooltip } from '@/shared/ui/tooltip';
import type { IconClassName } from '@/types/icons.types';

const ICON_BUTTON_CLASS = cx('fr-btn', 'fr-btn--tertiary-no-outline');
const SMALL_CLASS = cx('fr-btn--sm');

export function iconButtonClassName(props: { className?: string; iconId: IconClassName; small?: boolean }) {
  return clsx(ICON_BUTTON_CLASS, props.small && SMALL_CLASS, props.iconId, 'rounded-full', props.className);
}

export function IconButton({
  className,
  iconId,
  label,
  small,
  ...props
}: ComponentProps<'button'> & {
  iconId: IconClassName;
  label: string;
  small?: boolean;
}) {
  return (
    <Tooltip label={label}>
      <button
        {...props}
        aria-label={label}
        className={iconButtonClassName({ className, iconId, small })}
        type="button"
      />
    </Tooltip>
  );
}
