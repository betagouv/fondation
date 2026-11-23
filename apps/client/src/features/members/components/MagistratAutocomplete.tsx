import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { MagistratStatusBadge } from '@/features/magistrats/components/MagistratStatusBadge';
import type { DetailedMemberDto } from '@api/types';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

export type ExcludedMagistrat = DetailedMemberDto['excludedMagistrats'][number];

function MagistratOptionLabel(props: { magistrat: ExcludedMagistrat }) {
  const { currentPosition, grade, name, status } = props.magistrat;
  const position = [grade, currentPosition?.function?.label, currentPosition?.jurisdiction.label]
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <div className="flex items-center gap-2">
        {name}
        <MagistratStatusBadge status={status} />
      </div>
      {position && <div className="text-xs">{position}</div>}
    </div>
  );
}

/** the excluded magistrats come first, checked; the search leaves them out of its results */
export function MagistratAutocomplete(props: {
  excluded: readonly ExcludedMagistrat[];
  onChange: (selected: string[]) => void;
  selected: readonly string[];
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 400);
  const [ignore] = useState(() => props.excluded.map(({ id }) => id));
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMagistratSearchQuery({
    ignore,
    search: debouncedSearch,
  });

  const found = debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH ? (data?.pages ?? []) : [];
  const options = [...props.excluded, ...found.flatMap((page) => page.items)].map((magistrat) => ({
    label: <MagistratOptionLabel magistrat={magistrat} />,
    nativeInputProps: {
      checked: props.selected.includes(magistrat.id),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        props.onChange(
          event.target.checked
            ? [...props.selected, magistrat.id]
            : props.selected.filter((id) => id !== magistrat.id),
        ),
      value: magistrat.id,
    },
  }));

  return (
    <div className="flex flex-col">
      <SearchBar
        label="Rechercher un magistrat par son nom ou son prénom"
        renderInput={(inputProps) => (
          <input {...inputProps} onChange={(event) => setSearch(event.target.value)} value={search} />
        )}
      />
      <p className="fr-mt-1v fr-mb-0 text-xs">
        <FormattedMessage
          defaultMessage="{count, plural, one {# magistrat sélectionné} other {# magistrats sélectionnés}}"
          values={{ count: props.selected.length }}
        />
      </p>
      <div
        className="fr-mt-6v fr-px-2v max-h-[calc(var(--modal-max-height)-20rem)] min-h-0 overflow-y-auto md:max-h-[calc(80vh-20rem)]"
        onScroll={(event) => {
          const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
          if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage)
            void fetchNextPage();
        }}
      >
        {options.length > 0 && <Checkbox options={options} />}
        {(isLoading || isFetchingNextPage) && (
          <p>
            <FormattedMessage defaultMessage="Chargement..." />
          </p>
        )}
      </div>
    </div>
  );
}
