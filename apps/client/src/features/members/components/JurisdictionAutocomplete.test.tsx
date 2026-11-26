import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { JuridictionAutocomplete } from './JurisdictionAutocomplete';

describe('JuridictionAutocomplete', () => {
  it('tells that the search failed rather than that no court matches', async () => {
    vi.spyOn($api.jurisdictions, 'search').mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <IntlProvider defaultLocale="fr" locale="fr">
          <JuridictionAutocomplete selected={[]} />
        </IntlProvider>
      </QueryClientProvider>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Rechercher une juridiction' }), 'lyon');

    expect(
      await screen.findByText(
        "La recherche n'a pas pu aboutir. Modifiez la recherche ou réessayez plus tard",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Aucune juridiction ne correspond à la recherche')).not.toBeInTheDocument();
  });
});
