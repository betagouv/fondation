import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { DropdownMenu } from '@/shared/ui/DropdownMenu';

const DROPDOWN_WIDTH = 'w-72';

const SOFT_PANEL =
  'fr-p-3v max-h-80 overflow-y-auto rounded-lg border border-(--border-default-grey) shadow-[0_4px_16px_rgba(0,0,0,0.12)] [&_.fr-fieldset]:mb-0 [&_.fr-fieldset__element:last-child]:mb-0 [&_.fr-messages-group]:hidden [&_.fr-badge]:min-w-0! [&_.fr-badge]:justify-start';

export function SoftDropdown(props: {
  label: ReactNode;
  surfaceClassName?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  const trigger = (
    <div className={DROPDOWN_WIDTH}>
      <Button
        className="w-full justify-between! [&_.fr-badge]:min-w-0! [&_.fr-badge]:justify-start"
        iconId={open ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
        iconPosition="right"
        priority="tertiary"
        size="small"
      >
        {props.label}
      </Button>
    </div>
  );
  return (
    <DropdownMenu isOpen={open} onOpenChange={setOpen} trigger={trigger}>
      <div
        aria-label={intl.formatMessage({ defaultMessage: 'Sélection' })}
        className={`${SOFT_PANEL} ${DROPDOWN_WIDTH} ${props.surfaceClassName ?? 'bg-(--background-default-grey)'}`}
        role="dialog"
      >
        {typeof props.children === 'function' ? props.children(() => setOpen(false)) : props.children}
      </div>
    </DropdownMenu>
  );
}
