import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { MagistratGradeAndPosition } from '@/features/magistrats/components/MagistratGradeAndPosition';
import { MagistratStatusBadge } from '@/features/magistrats/components/MagistratStatusBadge';
import { SearchableCheckboxList } from '@/shared/ui/searchable-checkbox-list';
import { useToasts } from '@/shared/ui/toast';
import type { DetailedMemberDto } from '@api/types';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

const SEARCH_FAILED_TOAST = 'excluded-magistrat-search-failed';

export type ExcludedMagistrat = DetailedMemberDto['excludedMagistrats'][number];

function MagistratOptionLabel(props: { magistrat: ExcludedMagistrat }) {
  return (
    <span className="flex items-center gap-2">
      {props.magistrat.name}
      <MagistratStatusBadge status={props.magistrat.status} />
    </span>
  );
}

/**
 * the excluded magistrats come first, checked, then the ones checked during this search, which stay
 * listed when the search changes; the search leaves the excluded ones out of its results
 */
export function MagistratAutocomplete(props: {
  excluded: readonly ExcludedMagistrat[];
  onChange: (selected: string[]) => void;
  selected: readonly string[];
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 400);
  const [ignore] = useState(() => props.excluded.map(({ id }) => id));
  const [picked, setPicked] = useState<readonly ExcludedMagistrat[]>([]);
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMagistratSearchQuery({
    ignore,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (error)
      toasts.error({
        description: formatMessage({ defaultMessage: 'Modifiez la recherche ou réessayez plus tard.' }),
        id: SEARCH_FAILED_TOAST,
        title: formatMessage({ defaultMessage: "La recherche n'a pas pu aboutir" }),
      });
    else toasts.close(SEARCH_FAILED_TOAST);
  }, [error, formatMessage, toasts]);

  const isLongEnough = search.trim().length >= MAGISTRAT_SEARCH_MIN_LENGTH;
  const found = (debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH ? (data?.pages ?? []) : []).flatMap(
    (page) => page.items,
  );
  const foundIds = new Set(found.map(({ id }) => id));
  const pickedIds = new Set(picked.map(({ id }) => id));
  // a magistrat checked in the results keeps its place, and moves up once the search leaves it out
  const magistrats = [...props.excluded, ...picked.filter(({ id }) => !foundIds.has(id)), ...found];

  return (
    <SearchableCheckboxList
      checked={props.selected}
      countLabel={
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Aucun magistrat sélectionné} one {# magistrat sélectionné} other {# magistrats sélectionnés}}"
          values={{ count: props.selected.length }}
        />
      }
      emptyLabel={
        // the toast already says the search failed
        error ? null : !isLongEnough ? (
          <FormattedMessage
            defaultMessage="Saisissez au moins {count} caractères pour rechercher un magistrat"
            values={{ count: MAGISTRAT_SEARCH_MIN_LENGTH }}
          />
        ) : (
          <FormattedMessage defaultMessage="Aucun magistrat ne correspond à la recherche" />
        )
      }
      isLoading={isLoading || isFetchingNextPage || (isLongEnough && search.trim() !== debouncedSearch)}
      legend={<FormattedMessage defaultMessage="Magistrats exclus" />}
      onChange={(checked) => {
        const newlyPicked = magistrats.filter(
          ({ id }) => checked.includes(id) && !ignore.includes(id) && !pickedIds.has(id),
        );
        if (newlyPicked.length > 0) setPicked((current) => [...current, ...newlyPicked]);
        props.onChange(checked);
      }}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !error) void fetchNextPage();
      }}
      onSearchChange={setSearch}
      options={magistrats.map((magistrat) => ({
        hint: (magistrat.grade || magistrat.currentPosition) && <MagistratGradeAndPosition {...magistrat} />,
        id: magistrat.id,
        label: <MagistratOptionLabel magistrat={magistrat} />,
      }))}
      search={search}
      searchLabel={formatMessage({ defaultMessage: 'Rechercher un magistrat par son nom ou son prénom' })}
    />
  );
}
