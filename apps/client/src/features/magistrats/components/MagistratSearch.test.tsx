import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import * as $api from '@api/sdk';
import type { FoundMagistrat } from '@queries/magistrats.queries';

import { MagistratSearch } from './MagistratSearch';

const searchMagistrats = vi.spyOn($api.magistrats, 'searchMagistrats');

function renderSearch(props?: { path?: string; searchParams?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const searchAt = (searchParams = '') => (
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <MemoryRouter initialEntries={[props?.path ?? '/secretariat-general/magistrats']}>
          <NuqsTestingAdapter hasMemory searchParams={searchParams}>
            <MagistratSearch />
          </NuqsTestingAdapter>
        </MemoryRouter>
      </IntlProvider>
    </QueryClientProvider>
  );
  const view = render(searchAt(props?.searchParams));
  return { navigateTo: (searchParams: string) => view.rerender(searchAt(searchParams)) };
}

describe('MagistratSearch', () => {
  beforeEach(() => {
    searchMagistrats.mockReset();
  });

  it('leads back to the secretariat general from its breadcrumb', () => {
    renderSearch();

    const breadcrumb = screen.getByRole('navigation', {
      name: "Fil d'Ariane de la recherche d'un magistrat",
    });
    expect(within(breadcrumb).getByRole('link', { name: 'Secrétariat général' })).toHaveAttribute(
      'href',
      '/secretariat-general',
    );
    expect(within(breadcrumb).getByText('Rechercher un magistrat')).toHaveAttribute('aria-current', 'page');
  });

  it('leads a member back to the transparences from the breadcrumb', () => {
    renderSearch({ path: '/magistrats' });

    const breadcrumb = screen.getByRole('navigation', {
      name: "Fil d'Ariane de la recherche d'un magistrat",
    });
    expect(within(breadcrumb).getByRole('link', { name: 'Transparences' })).toHaveAttribute(
      'href',
      '/transparences',
    );
  });

  it('invites to search by first or last name under 2 characters', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox', { name: 'Rechercher par nom ou prénom' }), 'v');

    expect(screen.getByText('Recherchez un magistrat par son prénom ou son nom.')).toBeInTheDocument();
    expect(searchMagistrats).not.toHaveBeenCalled();
  });

  it('shows the found magistrats with their total', async () => {
    searchMagistrats.mockResolvedValue(
      found([
        {
          currentPosition: {
            function: { id: 'PR', label: 'Procureur de la République' },
            jurisdiction: { id: 'CA  LYON', label: "Cour d'appel de Lyon" },
          },
          grade: 'G3',
          gradeAndJurisdiction: 'G3 - CA LYON',
          id: 'magistrat-1',
          name: 'VALROSE Honorine',
        },
        {
          currentPosition: {
            function: null,
            jurisdiction: { id: 'TJ  RODEZ', label: 'Tribunal judiciaire de Rodez' },
          },
          grade: 'G2',
          gradeAndJurisdiction: 'G2 - TJ RODEZ',
          id: 'magistrat-2',
          name: 'VALROSE Marc',
        },
      ]),
    );
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox', { name: 'Rechercher par nom ou prénom' }), 'valr');

    const honorine = await screen.findByRole('article', { name: 'VALROSE Honorine' });
    expect(within(honorine).getByText('Procureur de la République')).toBeInTheDocument();
    expect(within(honorine).getByText('G3 - CA LYON')).toBeInTheDocument();
    expect(within(honorine).getByRole('link', { name: 'VALROSE Honorine' })).toHaveAttribute(
      'href',
      '/secretariat-general/magistrats/magistrat-1',
    );
    const marc = screen.getByRole('article', { name: 'VALROSE Marc' });
    expect(within(marc).getByText('Tribunal judiciaire de Rodez')).toBeInTheDocument();
    expect(within(marc).getByText('G2 - TJ RODEZ')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 résultats');
    expect(searchMagistrats).toHaveBeenCalledWith(
      expect.objectContaining({ query: { page: 1, search: 'valr' } }),
    );
  });

  it('tells when no magistrat matches', async () => {
    searchMagistrats.mockResolvedValue(found([]));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox', { name: 'Rechercher par nom ou prénom' }), 'zz{Enter}');

    expect(await screen.findByText('Aucun résultat ne correspond aux valeurs saisies.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 résultat');
  });

  it('restores the search from the URL', async () => {
    searchMagistrats.mockResolvedValue(
      found([
        {
          currentPosition: null,
          grade: null,
          gradeAndJurisdiction: null,
          id: 'magistrat-1',
          name: 'VALROSE Honorine',
        },
      ]),
    );
    renderSearch({ searchParams: '?recherche=valr' });

    expect(await screen.findByRole('article', { name: 'VALROSE Honorine' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Rechercher par nom ou prénom' })).toHaveValue('valr');
  });

  it('empties the search when the URL loses it, as when following the navigation link', async () => {
    searchMagistrats.mockResolvedValue(
      found([
        {
          currentPosition: null,
          grade: null,
          gradeAndJurisdiction: null,
          id: 'magistrat-1',
          name: 'VALROSE Honorine',
        },
      ]),
    );
    const { navigateTo } = renderSearch({ searchParams: '?recherche=valr' });
    await screen.findByRole('article', { name: 'VALROSE Honorine' });

    navigateTo('');

    expect(screen.getByRole('searchbox', { name: 'Rechercher par nom ou prénom' })).toHaveValue('');
    expect(await screen.findByText('Recherchez un magistrat par son prénom ou son nom.')).toBeInTheDocument();
  });

  it('adds the next magistrats from "Voir plus" until all are shown', async () => {
    searchMagistrats
      .mockResolvedValueOnce(
        found(
          [
            {
              currentPosition: null,
              grade: null,
              gradeAndJurisdiction: null,
              id: 'magistrat-1',
              name: 'VALROSE Honorine',
            },
          ],
          {
            nextPageIndex: 2,
            totalCount: 2,
          },
        ),
      )
      .mockResolvedValueOnce(
        found(
          [
            {
              currentPosition: null,
              grade: null,
              gradeAndJurisdiction: null,
              id: 'magistrat-2',
              name: 'VALROSE Marc',
            },
          ],
          {
            totalCount: 2,
          },
        ),
      );
    const user = userEvent.setup();
    renderSearch({ searchParams: '?recherche=valr' });

    await user.click(await screen.findByRole('button', { name: 'Voir plus' }));

    expect(await screen.findByRole('article', { name: 'VALROSE Marc' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'VALROSE Honorine' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir plus' })).not.toBeInTheDocument();
    expect(searchMagistrats).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: { page: 2, search: 'valr' } }),
    );
  });
});

function found(
  items: Pick<FoundMagistrat, 'currentPosition' | 'grade' | 'gradeAndJurisdiction' | 'id' | 'name'>[],
  page?: { nextPageIndex?: number; totalCount: number },
) {
  return {
    data: {
      currentPageIndex: 1,
      items: items.map((item) => ({
        ...item,
        firstName: '',
        lastName: '',
        status: 'ACTIVE',
        usedName: null,
      })),
      totalCount: items.length,
      ...page,
    },
  } as unknown as Awaited<ReturnType<typeof $api.magistrats.searchMagistrats>>;
}
