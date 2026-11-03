import clsx from 'clsx';
import type { Ref } from 'react';
import { FormattedMessage } from 'react-intl';

import { MEMBER_TAG } from '../member-tag';
import { useRecusalLabel } from '../recused-members/RecusalIcon';
import { PriorityBadge } from '@/shared/components/priority-badge';
import { PrioriteEnum } from '@/shared/enums/priorite.enum';
import { Dropdown, type DropdownHandle } from '@/shared/ui/dropdown';
import { memberFullName } from '@/utils/user.utils';

const PRIORITY_ITEMS = Object.values(PrioriteEnum);

const NO_EXCLUSION: ReadonlyMap<string, string> = new Map();

const NO_REPORTER = 'none';

export function PrioritySelect(props: {
  disabled?: boolean;
  onChange: (value: PrioriteEnum[]) => void;
  value: readonly PrioriteEnum[];
}) {
  const options = PRIORITY_ITEMS.map((priority) => ({
    label: <PriorityBadge priority={priority} small={false} />,
    value: priority,
  }));

  return (
    <Dropdown
      disabled={props.disabled}
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
  disabled?: boolean;
  excludedTitleByRapporteurId?: ReadonlyMap<string, string>;
  isRecused?: (memberId: string) => boolean;
  onChange: (ids: string[]) => void;
  onClear?: () => void;
  ref?: Ref<DropdownHandle>;
  value: readonly string[];
}) {
  const {
    available,
    excludedTitleByRapporteurId = NO_EXCLUSION,
    isRecused,
    onChange,
    onClear,
    ref,
    value,
  } = props;

  const recusalLabel = useRecusalLabel();

  const reporterOptions = [...available]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((reporter) => {
      const warnings = [
        excludedTitleByRapporteurId.get(reporter.userId),
        isRecused?.(reporter.userId) ? recusalLabel : undefined,
      ].filter((warning) => warning !== undefined);
      const title = warnings.length > 0 ? warnings.join('\n') : undefined;

      return {
        label: (
          <span
            className={clsx(
              MEMBER_TAG,
              title ? 'text-(--text-default-warning)!' : 'text-(--text-action-high-blue-france)!',
            )}
            title={title}
          >
            {memberFullName(reporter)}
            {warnings.length > 0 && (
              <>
                {/* keeps the warnings apart from the member name in the accessible name of an option */}{' '}
                <span className="fr-sr-only">{warnings.join('. ')}</span>
              </>
            )}
          </span>
        ),
        value: reporter.userId,
      };
    });

  const options = onClear
    ? [
        {
          label: (
            <span
              className={clsx(
                MEMBER_TAG,
                'fr-tag--icon-left fr-icon-close-circle-line text-(--text-action-high-blue-france)!',
              )}
            >
              <FormattedMessage defaultMessage="Aucun" />
            </span>
          ),
          value: NO_REPORTER,
        },
        ...reporterOptions,
      ]
    : reporterOptions;

  return (
    <Dropdown
      disabled={props.disabled}
      label={<FormattedMessage defaultMessage="Affecter un rapporteur" />}
      multiple
      onSelect={(ids) => {
        if (ids.includes(NO_REPORTER)) onClear?.();
        else onChange(ids);
      }}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      ref={ref}
      selected={value}
    />
  );
}
