import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { authKeys } from '@queries/auth.queries';

import { CallForApplicationsHistoryModal } from './CallForApplicationsHistoryModal';

const ME = { firstName: 'Anne', id: 'me', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };

describe('CallForApplicationsHistoryModal', () => {
  it('lists the changes with their author and the fields they touched', () => {
    const client = new QueryClient();
    client.setQueryData(authKeys.introspectSession(), ME);

    render(
      <QueryClientProvider client={client}>
        <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr" timeZone="Europe/Paris">
          <CallForApplicationsHistoryModal
            history={[
              {
                action: 'UPDATED',
                at: '2026-11-22T13:00:00.000Z',
                by: { id: 'me', name: 'Anne ROY' },
                fields: [
                  { id: 'DEADLINE', label: 'la date limite' },
                  { id: 'COMMENT', label: 'le commentaire' },
                ],
              },
              {
                action: 'CREATED',
                at: '2026-11-20T09:30:00.000Z',
                by: { id: 'paul', name: 'Paul MARTIN' },
                fields: [],
              },
            ]}
            onClose={vi.fn()}
            onClosed={vi.fn()}
            open
          />
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Vous avez modifié la date limite et le commentaire')).toBeInTheDocument();
    expect(screen.getByText("Paul MARTIN a créé l'appel")).toBeInTheDocument();
  });
});
