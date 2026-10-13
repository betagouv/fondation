import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import * as $api from '@api/sdk';
import type { FoundMagistrat } from '@queries/magistrats.queries';

import { MagistratSearch } from './MagistratSearch';

const searchMagistrats = vi.spyOn($api.magistrats, 'searchMagistrats');

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <MemoryRouter>
          <MagistratSearch context="sg" />
        </MemoryRouter>
      </IntlProvider>
    </QueryClientProvider>,
  );
}

describe('MagistratSearch', () => {
  beforeEach(() => {
    searchMagistrats.mockReset();
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
            jurisdiction: { id: 'CA LYON', label: "Cour d'appel de Lyon" },
          },
          grade: 'G3',
          id: 'magistrat-1',
          name: 'VALROSE Honorine',
        },
        {
          currentPosition: {
            function: null,
            jurisdiction: { id: 'TJ RODEZ', label: 'Tribunal judiciaire de Rodez' },
          },
          grade: 'G2',
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
    expect(
      within(honorine).getByRole('link', { name: 'Ouvrir la fiche de VALROSE Honorine' }),
    ).toHaveAttribute('href', '/secretariat-general/magistrats/magistrat-1');
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
});

function found(items: Pick<FoundMagistrat, 'currentPosition' | 'grade' | 'id' | 'name'>[]) {
  return {
    data: {
      currentPageIndex: 1,
      items: items.map((item) => ({ ...item, firstName: '', lastName: '' })),
      totalCount: items.length,
    },
  } as unknown as Awaited<ReturnType<typeof $api.magistrats.searchMagistrats>>;
}
