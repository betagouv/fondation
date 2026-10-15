import Button from '@codegouvfr/react-dsfr/Button';
import Avatar from '@codegouvfr/react-dsfr/picto/Avatar';
import clsx from 'clsx';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounce } from 'use-debounce';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { SearchInput } from '@/shared/ui/search-input';
import { useToasts } from '@/shared/ui/toast';
import { getMagistratDetailsPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import { MAGISTRAT_SEARCH_MIN_LENGTH, useMagistratSearchQuery } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

const SEARCH_FAILED_TOAST = 'magistrat-search-failed';

export function MagistratSearch() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const isSgNavigation = useIsSgNavigation();
  const [search, setSearch] = useQueryState('recherche', parseAsString.withDefault(''));
  const [debouncedSearch] = useDebounce(search.trim(), 400);
  const isSearchable = debouncedSearch.length >= MAGISTRAT_SEARCH_MIN_LENGTH;
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMagistratSearchQuery({
    search: debouncedSearch,
  });
  const totalCount = isSearchable ? data?.pages[0]?.totalCount : undefined;
  const shownCount = data?.pages.reduce((count, page) => count + page.items.length, 0) ?? 0;
  const isPrompting = totalCount === undefined;

  useEffect(() => {
    if (error)
      toasts.error({
        description: formatMessage({ defaultMessage: 'Modifiez la recherche ou réessayez plus tard.' }),
        id: SEARCH_FAILED_TOAST,
        title: formatMessage({ defaultMessage: "La recherche n'a pas pu aboutir" }),
      });
    else toasts.close(SEARCH_FAILED_TOAST);
  }, [error, formatMessage, toasts]);

  // observes again once a page is loaded: the end of the list may still be in view, and an observer only reports changes
  const loadMoreOnScroll = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || isFetchingNextPage) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) fetchNextPage();
        },
        { rootMargin: '200px' },
      );
      observer.observe(element);
      return () => observer.disconnect();
    },
    [fetchNextPage, isFetchingNextPage],
  );

  // "Voir plus" would otherwise keep the focus below the magistrats it adds, unknown to a screen reader
  const [firstShownMoreId, setFirstShownMoreId] = useState<string>();
  const showMore = async () => {
    const result = await fetchNextPage();
    if (result.isSuccess) setFirstShownMoreId(result.data.pages.at(-1)?.items[0]?.id);
  };
  const focusFirstShownMore = useCallback((item: HTMLLIElement | null) => {
    item?.querySelector('a')?.focus();
    setFirstShownMoreId(undefined);
  }, []);

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
      <div className="fr-mb-12v mx-auto max-w-[66rem]">
        {/* the same elements change layout: the search input would otherwise lose the focus once magistrats are found */}
        <div
          className={clsx(
            'flex gap-4',
            isPrompting ? 'fr-mt-16v flex-col items-center gap-8' : 'flex-wrap items-center justify-between',
          )}
        >
          {isPrompting && <Avatar aria-hidden className="motion-safe:animate-fade-in" fontSize="7.75rem" />}
          <h1 className="fr-h3 fr-mb-0">
            <FormattedMessage defaultMessage="Rechercher un magistrat" />
          </h1>
          <SearchInput
            className={clsx('w-full', isPrompting ? 'md:w-[33.375rem]' : 'md:w-82')}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder={formatMessage({ defaultMessage: 'Rechercher par nom ou prénom' })}
            value={search}
          />
        </div>
        {/* stays in the page once magistrats are found: a screen reader only announces the changes of a live region already there */}
        <p
          className={(totalCount ?? 0) > 0 ? 'fr-mt-8v fr-mb-3v mx-auto max-w-3xl' : 'fr-sr-only'}
          role="status"
        >
          {totalCount !== undefined &&
            (shownCount < totalCount ? (
              <FormattedMessage
                defaultMessage="{shownCount, plural, one {# résultat affiché} other {# résultats affichés}} sur {totalCount}"
                values={{ shownCount, totalCount }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="{totalCount, plural, one {# résultat} other {# résultats}}"
                values={{ totalCount }}
              />
            ))}
        </p>
        {totalCount === 0 ? (
          <p className="fr-mt-20v fr-mb-0 text-center motion-safe:animate-fade-in">
            <FormattedMessage defaultMessage="Aucun résultat ne correspond aux valeurs saisies." />
          </p>
        ) : (
          totalCount !== undefined && (
            <div className="mx-auto max-w-3xl">
              <ul className="fr-mt-0 flex list-none flex-col gap-4 ps-0">
                {data?.pages.flatMap((page) =>
                  page.items.map((magistrat, index) => (
                    <li
                      className="pb-0 motion-safe:animate-fade-in"
                      key={magistrat.id}
                      ref={magistrat.id === firstShownMoreId ? focusFirstShownMore : undefined}
                      style={{ '--fade-in-delay': `${index * 40}ms` } as CSSProperties}
                    >
                      <MagistratSearchCard
                        detailsPath={getMagistratDetailsPath({
                          context: isSgNavigation ? 'sg' : 'membre',
                          magistratId: magistrat.id,
                        })}
                        magistrat={magistrat}
                      />
                    </li>
                  )),
                )}
              </ul>
              {hasNextPage && (
                <div className="fr-mt-6v flex justify-center" ref={loadMoreOnScroll}>
                  {/* an explicit control for assistive technologies, which do not always scroll */}
                  <Button disabled={isFetchingNextPage} onClick={showMore} priority="secondary">
                    <FormattedMessage defaultMessage="Voir plus" />
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}
