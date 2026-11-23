import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { MagistratStatusBadge } from '@/features/magistrats/components/MagistratStatusBadge';
import { useToasts } from '@/shared/ui/toast';
import type { DetailedMemberDto } from '@api/types';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

const SEARCH_FAILED_TOAST = 'excluded-magistrat-search-failed';

export type ExcludedMagistrat = DetailedMemberDto['excludedMagistrats'][number];

function MagistratOptionLabel(props: { magistrat: ExcludedMagistrat }) {
  const { currentPosition, gradeAndJurisdiction, name, status } = props.magistrat;
  const positionLabel = currentPosition?.function?.label ?? currentPosition?.jurisdiction.label;

  return (
    <div>
      <div className="flex items-center gap-2">
        {name}
        <MagistratStatusBadge status={status} />
      </div>
      {positionLabel && <div className="text-xs">{positionLabel}</div>}
      {gradeAndJurisdiction && <div className="text-xs">{gradeAndJurisdiction}</div>}
    </div>
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

  const found = (debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH ? (data?.pages ?? []) : []).flatMap(
    (page) => page.items,
  );
  const foundIds = new Set(found.map(({ id }) => id));
  const pickedIds = new Set(picked.map(({ id }) => id));
  // a magistrat checked in the results keeps its place, and moves up once the search leaves it out
  const options = [...props.excluded, ...picked.filter(({ id }) => !foundIds.has(id)), ...found].map(
    (magistrat) => ({
      label: <MagistratOptionLabel magistrat={magistrat} />,
      nativeInputProps: {
        checked: props.selected.includes(magistrat.id),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          if (!ignore.includes(magistrat.id) && !pickedIds.has(magistrat.id))
            setPicked((current) => [...current, magistrat]);
          props.onChange(
            event.target.checked
              ? [...props.selected, magistrat.id]
              : props.selected.filter((id) => id !== magistrat.id),
          );
        },
        value: magistrat.id,
      },
    }),
  );

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
