import { Link, type LinkProps } from 'react-router';

import { IconButton, iconButtonClassName } from '@/shared/ui/icon-button';
import { Tooltip } from '@/shared/ui/tooltip';
import type { IconClassName } from '@/types/icons.types';

export function IconLink(props: {
  className?: string;
  disabled?: boolean;
  iconId: IconClassName;
  label: string;
  newTab?: boolean;
  small?: boolean;
  to: LinkProps['to'];
}) {
  const { className, disabled, iconId, label, newTab, small, to } = props;

  if (disabled)
    return <IconButton className={className} disabled iconId={iconId} label={label} small={small} />;

  return (
    <Tooltip label={label}>
      <Link
        aria-label={label}
        className={iconButtonClassName({ className, iconId, small })}
        rel={newTab ? 'noopener noreferrer' : undefined}
        target={newTab ? '_blank' : undefined}
        to={to}
      />
    </Tooltip>
  );
}
