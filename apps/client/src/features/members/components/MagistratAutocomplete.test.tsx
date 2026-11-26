import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/shared/ui/toast';
import * as $api from '@api/sdk';

import { MagistratAutocomplete } from './MagistratAutocomplete';

const searchMagistrats = vi.spyOn($api.magistrats, 'searchMagistrats');

function found(id: string, name: string) {
  return {
    data: {
      currentPageIndex: 1,
      items: [{ currentPosition: null, grade: null, id, name, status: 'ACTIVE' }],
      totalCount: 1,
    },
  } as unknown as Awaited<ReturnType<typeof $api.magistrats.searchMagistrats>>;
}

function SelectingAutocomplete() {
  const [selected, setSelected] = useState<string[]>([]);
  return <MagistratAutocomplete excluded={[]} onChange={setSelected} selected={selected} />;
}

function renderAutocomplete() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ToastProvider>
          <SelectingAutocomplete />
        </ToastProvider>
      </IntlProvider>
    </QueryClientProvider>,
  );
}

describe('MagistratAutocomplete', () => {
  beforeEach(() => {
    searchMagistrats.mockReset();
  });

  it('keeps listing a magistrat checked in an earlier search', async () => {
    searchMagistrats
      .mockResolvedValueOnce(found('dupont', 'DUPONT Louise'))
      .mockResolvedValue(found('martin', 'MARTIN Paul'));
    const user = userEvent.setup();
    renderAutocomplete();

    const search = screen.getByRole('textbox', { name: 'Rechercher un magistrat par son nom ou son prénom' });
    await user.type(search, 'Dupont');
    await user.click(await screen.findByRole('checkbox', { name: /DUPONT Louise/ }));
    await user.clear(search);
    await user.type(search, 'Martin');
    await screen.findByRole('checkbox', { name: /MARTIN Paul/ });

    expect(screen.getByRole('checkbox', { name: /DUPONT Louise/ })).toBeChecked();
  });

  it('tells when the search fails', async () => {
    searchMagistrats.mockRejectedValue(new Error('Internal Server Error'));
    const user = userEvent.setup();
    renderAutocomplete();

    await user.type(
      screen.getByRole('textbox', { name: 'Rechercher un magistrat par son nom ou son prénom' }),
      'Dupont',
    );

    expect(
      await within(screen.getByRole('region', { name: 'Notifications' })).findByText(
        "La recherche n'a pas pu aboutir",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Aucun magistrat ne correspond à la recherche')).not.toBeInTheDocument();
  });

  it('reads a search long enough as loading until it runs', async () => {
    searchMagistrats.mockResolvedValue(found('dupont', 'DUPONT Louise'));
    const user = userEvent.setup();
    renderAutocomplete();

    await user.type(
      screen.getByRole('textbox', { name: 'Rechercher un magistrat par son nom ou son prénom' }),
      'Du',
    );

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(screen.queryByText(/Saisissez au moins/)).not.toBeInTheDocument();
  });
});
