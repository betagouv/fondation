import clsx from 'clsx';
import { useId, type Ref } from 'react';
import { FormattedMessage } from 'react-intl';

import { MEMBER_TAG } from '../member-tag';
import type { NonAffectableReason } from '../recused-members/recused-reporters';
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
  /**
   * why a member cannot become a reporter of the file; a reporter in place who excluded the
   * proposed magistrat since stays selected, until removed
   */
  nonAffectableReason?: (memberId: string) => NonAffectableReason | undefined;
  onChange: (ids: string[]) => void;
  onClear?: () => void;
  ref?: Ref<DropdownHandle>;
  value: readonly string[];
}) {
  const {
    available,
    excludedTitleByRapporteurId = NO_EXCLUSION,
    nonAffectableReason,
    onChange,
    onClear,
    ref,
    value,
  } = props;
  const hintId = useId();

  const blockedReasons = new Set<NonAffectableReason>();
  const reporterOptions = [...available]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((reporter) => {
      const reason = value.includes(reporter.userId) ? undefined : nonAffectableReason?.(reporter.userId);
      const nonAffectable = !!reason;
      if (reason) blockedReasons.add(reason);
      // the reason already tells why a member cannot be chosen
      const title = nonAffectable ? undefined : excludedTitleByRapporteurId.get(reporter.userId);

      return {
        disabled: nonAffectable,
        label: (
          <span
            className={clsx(
              MEMBER_TAG,
              nonAffectable
                ? 'text-(--text-disabled-grey)!'
                : title
                  ? 'text-(--text-default-warning)!'
                  : 'text-(--text-action-high-blue-france)!',
            )}
            title={title}
          >
            {reason === 'RECUSED' ? (
              <FormattedMessage
                defaultMessage="{member} (déport)"
                values={{ member: memberFullName(reporter) }}
              />
            ) : reason === 'EXCLUDED_MAGISTRAT' ? (
              <FormattedMessage
                defaultMessage="{member} (magistrat exclu)"
                values={{ member: memberFullName(reporter) }}
              />
            ) : (
              memberFullName(reporter)
            )}
            {title && (
              <>
                {/* keeps the warning apart from the member name in the accessible name of an option */}{' '}
                <span className="fr-sr-only">{title}</span>
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
    <>
      <Dropdown
        aria-describedby={blockedReasons.size > 0 ? hintId : undefined}
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
      {blockedReasons.size > 0 && (
        <p className="fr-hint-text fr-mb-0" id={hintId}>
          {blockedReasons.has('RECUSED') && (
            <FormattedMessage defaultMessage="Un membre déporté de ce dossier ne peut pas être affecté : retirez d'abord son déport." />
          )}
          {blockedReasons.size > 1 && ' '}
          {blockedReasons.has('EXCLUDED_MAGISTRAT') && (
            <FormattedMessage defaultMessage="Un membre qui a exclu le magistrat proposé ne peut pas être affecté." />
          )}
        </p>
      )}
    </>
  );
}
