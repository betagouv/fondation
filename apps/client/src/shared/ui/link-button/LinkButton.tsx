import './LinkButton.css';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { ComponentProps } from 'react';

import type { IconClassName } from '@/shared/ui/icons';

export function LinkButton({
  className,
  iconId,
  ...props
}: ComponentProps<'button'> & {
  iconId: IconClassName;
}) {
  return (
    <button
      {...props}
      className={clsx(
        cx('fr-link', 'fr-link--sm', 'fr-link--icon-left', iconId),
        'fr-icon--sm link-button',
        className,
      )}
      type="button"
    />
  );
}
