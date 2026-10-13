import Button from '@codegouvfr/react-dsfr/Button';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { parseAsString, useQueryState } from 'nuqs';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

export function MagistratSearch() {
  const { formatMessage } = useIntl();
  const isSgNavigation = useIsSgNavigation();
  const [search, setSearch] = useQueryState('recherche', parseAsString.withDefault(''));
  const [debouncedSearch, { flush }] = useDebounce(search.trim(), 400);
  const isSearchable = debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMagistratSearchQuery({
    search: debouncedSearch,
  });
  const totalCount = isSearchable ? data?.pages[0]?.totalCount : undefined;

  return (
    <>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la recherche d'un magistrat" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Rechercher un magistrat' }),
          segments: [
            isSgNavigation
              ? {
                  label: formatMessage({ defaultMessage: 'Secrétariat général' }),
                  to: ROUTE_PATHS.SG.DASHBOARD,
                }
              : {
                  label: formatMessage({ defaultMessage: 'Transparences' }),
                  to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
                },
          ],
        }}
        className="fr-mt-0"
        id="magistrat-search-breadcrumb"
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="fr-mb-0">
          <FormattedMessage defaultMessage="Rechercher un magistrat" />
        </h1>
        <SearchBar
          className="w-full md:w-96"
          label={formatMessage({ defaultMessage: 'Rechercher par nom ou prénom' })}
          onButtonClick={flush}
          renderInput={(params) => (
            <input {...params} onChange={(event) => setSearch(event.target.value)} value={search} />
          )}
        />
      </div>
      <p className="fr-sr-only" role="status">
        {totalCount !== undefined && (
          <FormattedMessage
            defaultMessage="{totalCount, plural, one {# résultat} other {# résultats}}"
            values={{ totalCount }}
          />
        )}
      </p>
      {!isSearchable ? (
        <p className="fr-mt-6v">
          <FormattedMessage defaultMessage="Recherchez un magistrat par son prénom ou son nom." />
        </p>
      ) : totalCount === 0 ? (
        <p className="fr-mt-6v">
          <FormattedMessage defaultMessage="Aucun résultat ne correspond aux valeurs saisies." />
        </p>
      ) : (
        <>
          <ul className="fr-mt-6v flex list-none flex-col gap-4 ps-0">
            {data?.pages.flatMap((page) =>
              page.items.map((magistrat) => (
                <li className="pb-0" key={magistrat.id}>
                  <MagistratSearchCard magistrat={magistrat} />
                </li>
              )),
            )}
          </ul>
          {hasNextPage && (
            <div className="fr-mt-6v flex justify-center">
              <Button disabled={isFetchingNextPage} onClick={() => fetchNextPage()} priority="secondary">
                <FormattedMessage defaultMessage="Voir plus" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
