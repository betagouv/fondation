import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { Link } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import type { IconClassName } from '@/types/icons.types';

const ICON_BUTTON_CLASS = cx('fr-btn', 'fr-btn--tertiary-no-outline', 'fr-btn--sm');

export function IconButton({
  iconId,
  label,
  ...props
}: ComponentProps<'button'> & { iconId: IconClassName; label: string }) {
  return (
    <Tooltip label={label}>
      <button
        {...props}
        aria-label={label}
        className={clsx(ICON_BUTTON_CLASS, iconId, 'rounded-full')}
        type="button"
      />
    </Tooltip>
  );
}

export function IconLink(props: { disabled?: boolean; iconId: IconClassName; label: string; to: string }) {
  if (props.disabled) return <IconButton disabled iconId={props.iconId} label={props.label} />;

  return (
    <Tooltip label={props.label}>
      <Link
        aria-label={props.label}
        className={clsx(ICON_BUTTON_CLASS, props.iconId, 'rounded-full')}
        to={props.to}
      />
    </Tooltip>
  );
}
