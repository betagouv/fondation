import clsx from 'clsx';
import type { Ref } from 'react';
import { FormattedMessage } from 'react-intl';

import { PriorityBadge } from '@/shared/components/priority-badge';
import { Dropdown, type DropdownHandle } from '@/shared/ui/dropdown';
import { PrioriteEnum } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const REPORTER_TAG = 'fr-tag font-normal! gap-1.5 bg-(--background-default-grey)!';

const NO_EXCLUSION: ReadonlyMap<string, string> = new Map();

export function PrioritySelect(props: {
  onChange: (value: PrioriteEnum[]) => void;
  value: readonly PrioriteEnum[];
}) {
  const options = PRIORITY_ITEMS.map((priority) => ({
    label: <PriorityBadge priority={priority} small={false} />,
    value: priority,
  }));

  return (
    <Dropdown
      label={<FormattedMessage defaultMessage="Définir une priorité" />}
      multiple
      onSelect={(values) => props.onChange(values as PrioriteEnum[])}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={props.value}
    />
  );
}

type Reporter = { firstName: string; lastName: string; userId: string };

export function ReporterSelect(props: {
  available: readonly Reporter[];
  excludedTitleByRapporteurId?: ReadonlyMap<string, string>;
  onChange: (ids: string[]) => void;
  ref?: Ref<DropdownHandle>;
  value: readonly string[];
}) {
  const { available, excludedTitleByRapporteurId = NO_EXCLUSION, onChange, ref, value } = props;

  const options = [...available]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((reporter) => {
      const excludedTitle = excludedTitleByRapporteurId.get(reporter.userId);

      return {
        label: (
          <span
            className={clsx(
              REPORTER_TAG,
              excludedTitle ? 'text-(--text-default-warning)!' : 'text-(--text-action-high-blue-france)!',
            )}
            title={excludedTitle}
          >
            {memberFullName(reporter)}
            {excludedTitle && <span className="fr-sr-only">{excludedTitle}</span>}
          </span>
        ),
        value: reporter.userId,
      };
    });

  return (
    <Dropdown
      label={<FormattedMessage defaultMessage="Affecter un rapporteur" />}
      multiple
      onSelect={onChange}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      ref={ref}
      selected={value}
    />
  );
}
