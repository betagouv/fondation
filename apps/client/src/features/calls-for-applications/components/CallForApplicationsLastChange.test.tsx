import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { authKeys } from '@queries/auth.queries';

import { CallForApplicationsLastChange } from './CallForApplicationsLastChange';

const ME = { firstName: 'Anne', id: 'me', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };
const AT = '2026-11-20T09:30:00.000Z';

describe('CallForApplicationsLastChange', () => {
  it('shows the day of the last change and describes the clock with the history', () => {
    const client = new QueryClient();
    client.setQueryData(authKeys.introspectSession(), ME);

    render(
      <QueryClientProvider client={client}>
        <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr" timeZone="Europe/Paris">
          <CallForApplicationsLastChange
            history={[
              {
                action: { id: 'CREATED', label: 'Créé' },
                at: AT,
                by: { id: 'paul', name: 'Paul MARTIN' },
              },
            ]}
          />
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('20/11/2026')).toBeInTheDocument();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      /20\/11\/2026 à 10.30Créé par Paul MARTIN/,
    );
  });
});
