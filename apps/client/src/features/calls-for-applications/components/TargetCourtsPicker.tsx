import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { SearchInput } from '@/shared/ui/search-input';
import { unaccent } from '@/utils/string.utils';
import type { FoundCallForApplicationsFormDto } from '@api/types';

function matches(label: string, search: string): boolean {
  return unaccent(label).toLowerCase().includes(unaccent(search.trim()).toLowerCase());
}

/** the courts of one type that a specific call targets: a search narrows a list of more than a hundred */
export function TargetCourtsPicker(props: {
  checked: readonly string[];
  courtGroup: FoundCallForApplicationsFormDto['targetCourtTypes'][number];
  /** the type is checked without any court: the form stays incomplete */
  isEmpty: boolean;
  onChange: (checked: string[]) => void;
}) {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState('');
  const { courts, type } = props.courtGroup;
  // both pickers may show at once: each names its type for a screen reader to tell them apart
  const group = type.label.toLowerCase();
  const shown = courts.filter((court) => matches(court.label, search));
  const checkedCount = courts.filter(({ id }) => props.checked.includes(id)).length;

  return (
    <fieldset className="fr-m-0 fr-p-0 flex flex-col gap-3 border-0">
      <legend className="fr-mb-2v mx-0 px-0 pb-0 font-semibold text-(--text-label-grey)">{type.label}</legend>
      <SearchInput
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder={formatMessage(
          { defaultMessage: 'Rechercher une juridiction parmi les {group}' },
          { group },
        )}
        value={search}
      />
      <p className="fr-mb-0 text-xs" role="status">
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Aucune juridiction sélectionnée parmi les {group}} one {# juridiction sélectionnée parmi les {group}} other {# juridictions sélectionnées parmi les {group}}}"
          values={{ count: checkedCount, group }}
        />
      </p>
      <div className="fr-px-1v max-h-60 overflow-y-auto">
        {shown.length > 0 && (
          <Checkbox
            className="fr-mb-0"
            options={shown.map(({ id, label }) => ({
              label,
              nativeInputProps: {
                checked: props.checked.includes(id),
                onChange: (event) =>
                  props.onChange(
                    event.target.checked
                      ? [...props.checked, id]
                      : props.checked.filter((court) => court !== id),
                  ),
                value: id,
              },
            }))}
            small
            state={props.isEmpty ? 'error' : 'default'}
            stateRelatedMessage={
              props.isEmpty
                ? formatMessage(
                    { defaultMessage: 'Choisissez au moins une juridiction parmi les {group}' },
                    { group },
                  )
                : undefined
            }
          />
        )}
        {/* mounted before the search empties the list so that the message is announced */}
        <p className="fr-mb-0" role="status">
          {shown.length === 0 && (
            <FormattedMessage defaultMessage="Aucune juridiction ne correspond à la recherche" />
          )}
        </p>
      </div>
    </fieldset>
  );
}
