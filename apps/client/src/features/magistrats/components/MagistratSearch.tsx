import Button from '@codegouvfr/react-dsfr/Button';
import Avatar from '@codegouvfr/react-dsfr/picto/Avatar';
import { parseAsString, useQueryState } from 'nuqs';
import { type CSSProperties } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { SearchInput } from '@/shared/ui/search-input';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

export function MagistratSearch() {
  const { formatMessage } = useIntl();
  const isSgNavigation = useIsSgNavigation();
  const [search, setSearch] = useQueryState('recherche', parseAsString.withDefault(''));
  const [debouncedSearch] = useDebounce(search.trim(), 400);
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
      <div className="mx-auto max-w-[66rem]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="fr-h3 fr-mb-0">
            <FormattedMessage defaultMessage="Rechercher un magistrat" />
          </h1>
          <SearchInput
            className="w-full md:w-82"
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder={formatMessage({ defaultMessage: 'Rechercher par nom ou prénom' })}
            value={search}
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
        {/* stacks the prompt and the results so that they cross-fade, the prompt staying mounted to fade out */}
        <div className="grid">
          <div
            className="fr-mt-20v col-start-1 row-start-1 flex-col items-center gap-6 transition-[display,opacity] transition-discrete duration-500 motion-reduce:transition-none starting:opacity-0 [&:not([hidden])]:flex [&[hidden]]:opacity-0"
            hidden={totalCount !== undefined}
          >
            <Avatar aria-hidden fontSize="10rem" />
            <p className="fr-mb-0">
              <FormattedMessage defaultMessage="Recherchez un magistrat par son prénom ou son nom." />
            </p>
          </div>
          {totalCount === 0 ? (
            <p className="fr-mt-8v col-start-1 row-start-1">
              <FormattedMessage defaultMessage="Aucun résultat ne correspond aux valeurs saisies." />
            </p>
          ) : (
            totalCount !== undefined && (
              <div className="col-start-1 row-start-1">
                <ul className="fr-mt-8v flex list-none flex-col gap-4 ps-0">
                  {data?.pages.flatMap((page) =>
                    page.items.map((magistrat, index) => (
                      <li
                        className="pb-0 motion-safe:animate-fade-in"
                        key={magistrat.id}
                        style={{ '--fade-in-delay': `${index * 40}ms` } as CSSProperties}
                      >
                        <MagistratSearchCard magistrat={magistrat} />
                      </li>
                    )),
                  )}
                </ul>
                {hasNextPage && (
                  <div className="fr-mt-6v flex justify-center">
                    <Button
                      disabled={isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                      priority="secondary"
                    >
                      <FormattedMessage defaultMessage="Voir plus" />
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
