import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { PriorityBadge, PriorityBadgeList } from '@/shared/components/priority-badge/PriorityBadge';
import { DropdownMenu } from '@/shared/ui/DropdownMenu';
import { PrioriteEnum } from '@/types/enums.types';
import { toFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const REPORTER_TAG =
  'fr-tag font-normal! bg-(--background-default-grey)! text-(--text-action-high-blue-france)!';

const SOFT_PANEL =
  'fr-p-3v max-h-80 w-max overflow-y-auto rounded-lg border border-(--border-default-grey) shadow-[0_4px_16px_rgba(0,0,0,0.12)] [&_.fr-fieldset]:mb-0 [&_.fr-fieldset__element:last-child]:mb-0 [&_.fr-messages-group]:hidden [&_.fr-badge]:min-w-0! [&_.fr-badge]:justify-start';

function SoftDropdown(props: { label: ReactNode; surfaceClassName?: string; children: ReactNode }) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [minWidth, setMinWidth] = useState<number>();

  useEffect(() => {
    if (open && triggerRef.current) setMinWidth(triggerRef.current.offsetWidth);
  }, [open]);

  const trigger = (
    <div className="w-fit" ref={triggerRef}>
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
        className={`${SOFT_PANEL} ${props.surfaceClassName ?? 'bg-(--background-default-grey)'}`}
        role="dialog"
        style={{ minWidth }}
      >
        {props.children}
      </div>
    </DropdownMenu>
  );
}

export function MagistratPrioritySelect(props: {
  value: readonly PrioriteEnum[];
  onChange: (value: PrioriteEnum[]) => void;
  surfaceClassName?: string;
}) {
  const { value, onChange } = props;
  const toggle = (item: PrioriteEnum) =>
    onChange(value.includes(item) ? value.filter((p) => p !== item) : [...value, item]);

  return (
    <SoftDropdown
      label={
        value.length === 0 ? (
          <span className="text-sm">
            <FormattedMessage defaultMessage="Priorité" />
          </span>
        ) : (
          <PriorityBadgeList priorities={value} />
        )
      }
      surfaceClassName={props.surfaceClassName}
    >
      <Checkbox
        options={PRIORITY_ITEMS.map((item) => ({
          label: <PriorityBadge priority={item} />,
          nativeInputProps: { checked: value.includes(item), onChange: () => toggle(item) },
        }))}
        small
      />
    </SoftDropdown>
  );
}

type Reporter = { userId: string; firstName: string; lastName: string };

export function MagistratReporterSelect(props: {
  available: readonly Reporter[];
  value: readonly string[];
  onChange: (ids: string[]) => void;
  surfaceClassName?: string;
}) {
  const { available, value, onChange } = props;

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((r) => r !== id) : [...value, id]);

  const sorted = useMemo(
    () => [...available].sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [available],
  );
  const selected = useMemo(
    () => available.filter((reporter) => value.includes(reporter.userId)),
    [available, value],
  );

  return (
    <SoftDropdown
      label={
        selected.length === 0 ? (
          <FormattedMessage defaultMessage="Affecter un rapporteur" />
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            {selected.map((reporter) => (
              <span className={REPORTER_TAG} key={reporter.userId}>
                {toFullName(reporter)}
              </span>
            ))}
          </span>
        )
      }
      surfaceClassName={props.surfaceClassName}
    >
      <Checkbox
        options={sorted.map((reporter) => ({
          label: toFullName(reporter),
          nativeInputProps: {
            checked: value.includes(reporter.userId),
            onChange: () => toggle(reporter.userId),
          },
        }))}
        small
      />
    </SoftDropdown>
  );
}
