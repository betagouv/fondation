import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { PriorityBadge, PriorityBadgeList } from '@/shared/components/priority-badge';
import { SoftDropdown } from '@/shared/ui/soft-dropdown';
import { PrioriteEnum } from '@/types/enums.types';
import { toFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const REPORTER_TAG =
  'fr-tag font-normal! bg-(--background-default-grey)! text-(--text-action-high-blue-france)!';

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
