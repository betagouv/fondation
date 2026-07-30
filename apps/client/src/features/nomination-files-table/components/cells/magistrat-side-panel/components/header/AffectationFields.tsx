import clsx from 'clsx';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { PriorityBadge } from '@/shared/components/priority-badge';
import { Dropdown } from '@/shared/ui/dropdown';
import { PrioriteEnum } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const REPORTER_TAG = 'fr-tag font-normal! gap-1.5 bg-(--background-default-grey)!';

const NO_EXCLUSION: ReadonlyMap<string, string> = new Map();

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
  excludedTitleByRapporteurId?: ReadonlyMap<string, string>;
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const { available, excludedTitleByRapporteurId = NO_EXCLUSION, value, onChange } = props;

  const options = useMemo(
    () =>
      [...available]
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((reporter) => {
          const excludedTitle = excludedTitleByRapporteurId.get(reporter.userId);

          return {
            value: reporter.userId,
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
          };
        }),
    [available, excludedTitleByRapporteurId],
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
