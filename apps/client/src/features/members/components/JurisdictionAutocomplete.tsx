import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { SearchableCheckboxList } from '@/shared/ui/searchable-checkbox-list';
import { useFoundJurisdictionsQuery } from '@queries/jurisdictions.queries';

export function JuridictionAutocomplete(props: {
  selected: readonly { id: string; label: string | null }[];
  onChange?: (selected: string[]) => unknown;
}) {
  const { formatMessage } = useIntl();
  const [selected, setSelected] = useState(props.selected.map(({ id }) => id));
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  // without a search the list shows the courts selected when the search was emptied: one unchecked stays in sight
  const [includeIds, setIncludeIds] = useState<string[] | undefined>(selected);
  const {
    data: foundJurisdictions,
    isError,
    isLoading,
  } = useFoundJurisdictionsQuery({
    includeIds,
    search: debouncedSearch,
  });

  return (
    <SearchableCheckboxList
      checked={selected}
      countLabel={
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Aucune juridiction sélectionnée} one {# juridiction sélectionnée} other {# juridictions sélectionnées}}"
          values={{ count: selected.length }}
        />
      }
      emptyLabel={
        isError ? (
          <FormattedMessage defaultMessage="La recherche n'a pas pu aboutir. Modifiez la recherche ou réessayez plus tard" />
        ) : (
          <FormattedMessage defaultMessage="Aucune juridiction ne correspond à la recherche" />
        )
      }
      isLoading={isLoading}
      legend={<FormattedMessage defaultMessage="Juridictions exclues" />}
      onChange={(checked) => {
        setSelected(checked);
        props.onChange?.(checked);
      }}
      onSearchChange={(value) => {
        setIncludeIds(value.trim() === '' ? [...selected] : undefined);
        setSearch(value);
      }}
      // the results of the previous search stay in the query while the new one fails
      options={(isError ? [] : (foundJurisdictions?.items ?? [])).map((item) => ({
        hint: item.label ? item.id : undefined,
        id: item.id,
        label: item.label ?? item.id,
      }))}
      search={search}
      searchLabel={formatMessage({ defaultMessage: 'Rechercher une juridiction' })}
    />
  );
}
