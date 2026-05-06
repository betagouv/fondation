import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useFoundJurisdictionsQuery } from '../jurisdictions.queries';

export function JuridictionAutocomplete(props: {
  selected: readonly { id: string; label: string | null }[];
  onChange?: (selected: string[]) => unknown;
}) {
  const [selected, setSelected] = useState(props.selected.map(({ id }) => id));
  const [debouncedSearch, setSearch] = useDebounce('', 400);

  const [includeIds, setIncludeIds] = useState<string[] | undefined>([...selected]);
  const { data: foundJurisdictions, isLoading } = useFoundJurisdictionsQuery({
    includeIds,
    search: debouncedSearch,
  });

  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return (
    <div className="flex flex-col">
      <SearchBar
        renderInput={(props) => (
          <input
            {...props}
            onChange={(e) => {
              const value = e.target.value.trim();

              setIncludeIds(value === '' ? [...selected] : undefined);
              setSearch(e.target.value);
            }}
          />
        )}
      />
      <p className="mb-0 mt-1 text-xs">
        {selected.length > 1
          ? `${selected.length} juridictions sélectionnées`
          : `${selected.length} juridiction sélectionnée`}
      </p>
      <div
        role="listbox"
        className="mt-6 flex max-h-[calc(var(--modal-max-height)-20rem)] min-h-0 list-none flex-col items-start gap-y-2 overflow-y-scroll px-2 md:max-h-[calc(80vh-20rem)]"
      >
        {isLoading ? (
          <p>Chargement ...</p>
        ) : (
          <Checkbox
            options={(foundJurisdictions?.items ?? []).map((item) => ({
              nativeInputProps: {
                value: item.id,
                checked: isSelected(item.id),
                role: 'option',
                onChange: (event) => {
                  setSelected((ids) => {
                    const newSelected = event.target.checked
                      ? ids.concat(item.id)
                      : ids.filter((i) => i !== item.id);
                    props.onChange?.(newSelected);
                    return newSelected;
                  });
                },
              },
              label: item.label ? (
                <div>
                  <div>{item.label}</div>
                  <div className="text-xs">({item.id})</div>
                </div>
              ) : (
                <div>{item.id}</div>
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
}
