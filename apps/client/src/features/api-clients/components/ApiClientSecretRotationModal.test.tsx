import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { ApiClientSecretRotationModal } from './ApiClientSecretRotationModal';

const rotateApiClientSecret = vi.spyOn($api.apiClients, 'rotateApiClientSecret');

describe('ApiClientSecretRotationModal', () => {
  it('cannot be closed while the new secret is on its way, which the server never gives again', async () => {
    rotateApiClientSecret.mockReturnValue(new Promise(() => {}) as never);
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IntlProvider defaultLocale="fr" locale="fr">
          <ApiClientSecretRotationModal
            client={{ id: '0b3c6f9e-6a1d-4f53-9a2e-5c8f1d2b7a41', name: 'Site du CSM' }}
            onClose={onClose}
            onClosed={vi.fn()}
            open
            secretRotationDays={{ default: 7, max: 30 }}
          />
        </IntlProvider>
      </QueryClientProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Générer un nouveau secret' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
