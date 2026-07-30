import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { PriorityBadge } from '@/shared/components/priority-badge';
import { Dropdown } from '@/shared/ui/dropdown';
import { PrioriteEnum } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const REPORTER_TAG =
  'fr-tag font-normal! bg-(--background-default-grey)! text-(--text-action-high-blue-france)!';

export function PrioritySelect(props: {
  value: readonly PrioriteEnum[];
  onChange: (value: PrioriteEnum[]) => void;
}) {
  const options = PRIORITY_ITEMS.map((priority) => ({
    value: priority,
    label: <PriorityBadge priority={priority} small={false} />,
  }));

  return (
    <Dropdown
      multiple
      label={<FormattedMessage defaultMessage="Définir une priorité" />}
      onSelect={(values) => props.onChange(values as PrioriteEnum[])}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={props.value}
    />
  );
}

type Reporter = { userId: string; firstName: string; lastName: string };

export function ReporterSelect(props: {
  available: readonly Reporter[];
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const { available, value, onChange } = props;

  const options = useMemo(
    () =>
      [...available]
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((reporter) => ({
          value: reporter.userId,
          label: <span className={REPORTER_TAG}>{memberFullName(reporter)}</span>,
        })),
    [available],
  );

  return (
    <Dropdown
      multiple
      label={<FormattedMessage defaultMessage="Affecter un rapporteur" />}
      onSelect={onChange}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={value}
    />
  );
}
