import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

export function MagistratSearch(props: { context: 'sg' | 'membre' }) {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState('');
  const [debouncedSearch, { flush }] = useDebounce(search.trim(), 400);
  const isSearchable = debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH;
  const { data } = useMagistratSearchQuery({ search: debouncedSearch });
  const totalCount = isSearchable ? data?.pages[0]?.totalCount : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="fr-mb-0">
          <FormattedMessage defaultMessage="Rechercher un magistrat" />
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <SearchBar
            className="w-full md:w-96"
            label={formatMessage({ defaultMessage: 'Rechercher par nom ou prénom' })}
            onButtonClick={flush}
            renderInput={(params) => (
              <input {...params} onChange={(event) => setSearch(event.target.value)} value={search} />
            )}
          />
          <p className="fr-mb-0" role="status">
            {totalCount !== undefined && (
              <FormattedMessage
                defaultMessage="{totalCount, plural, one {# résultat} other {# résultats}}"
                values={{ totalCount }}
              />
            )}
          </p>
        </div>
      </div>
      {!isSearchable ? (
        <p className="fr-mt-6v">
          <FormattedMessage defaultMessage="Recherchez un magistrat par son prénom ou son nom." />
        </p>
      ) : totalCount === 0 ? (
        <p className="fr-mt-6v">
          <FormattedMessage defaultMessage="Aucun résultat ne correspond aux valeurs saisies." />
        </p>
      ) : (
        <ul className="fr-mt-6v flex list-none flex-col gap-4 ps-0">
          {data?.pages.flatMap((page) =>
            page.items.map((magistrat) => (
              <li className="pb-0" key={magistrat.id}>
                <MagistratSearchCard context={props.context} magistrat={magistrat} />
              </li>
            )),
          )}
        </ul>
      )}
    </>
  );
}
