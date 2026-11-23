import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import * as $api from '@api/sdk';
import type { ListedApiClientsDto } from '@api/types';

import { ApiClientUpdateModal } from './ApiClientUpdateModal';

const updateApiClient = vi.spyOn($api.apiClients, 'updateApiClient');

const SCOPE = {
  defaultLimitPerMinute: 20,
  id: 'magistrats:identification',
  label: 'Identifier un magistrat par son adresse professionnelle',
} as const;

const CLIENT: ListedApiClientsDto['items'][number] = {
  allowedIps: [{ ip: '203.0.113.7' }],
  authLimitPerMinute: 10,
  canEndSecretRotation: false,
  canRevoke: true,
  canRotateSecret: true,
  canUpdate: true,
  id: '0b3c6f9e-6a1d-4f53-9a2e-5c8f1d2b7a41',
  lastTokenIssuedAt: null,
  name: 'Site du CSM',
  scopes: [{ limitPerMinute: 20, scope: SCOPE }],
  status: { value: 'ACTIVE' },
};

const renderModal = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ConfirmModalProvider>
          <ApiClientUpdateModal
            client={CLIENT}
            limitPerMinute={{ max: 10_000, min: 1 }}
            onClose={vi.fn()}
            onClosed={vi.fn()}
            open
            scopes={[SCOPE]}
          />
        </ConfirmModalProvider>
      </IntlProvider>
    </QueryClientProvider>,
  );

describe('ApiClientUpdateModal', () => {
  it('asks before taking every IP away, which refuses the client from everywhere', async () => {
    renderModal();

    await userEvent.clear(screen.getByRole('textbox', { name: /Adresses IP autorisées/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Retirer toutes les IP de « Site du CSM » ?')).toBeVisible();
    expect(updateApiClient).not.toHaveBeenCalled();
  });

  it('asks before closing every route, which leaves the client nothing to call', async () => {
    renderModal();

    await userEvent.click(screen.getByRole('checkbox', { name: SCOPE.label }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Retirer toutes les routes de « Site du CSM » ?')).toBeVisible();
    expect(updateApiClient).not.toHaveBeenCalled();
  });
});
