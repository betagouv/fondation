import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import * as $api from '@api/sdk';
import type { ListedMagistratAttachedEmailsDto } from '@api/types';

import { MagistratEmailsSection } from './MagistratEmailsSection';

const EMAIL = {
  attachedAt: '2026-11-20T09:30:00.000Z',
  attachedBy: { id: 'user-1', name: 'Sophie BERNARD' },
  email: 'jean.dupont@diplomatie.gouv.fr',
  id: 'attached-email-1',
};

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ConfirmModalProvider>
            <MagistratEmailsSection
              magistratId="magistrat-1"
              magistratName="Jean DUPONT"
              professionalEmail="JEAN.DUPONT@JUSTICE.FR"
            />
          </ConfirmModalProvider>
        </ToastProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('MagistratEmailsSection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists the email of LOLFI first then the attached ones under one title', async () => {
    vi.spyOn($api.magistrats, 'listMagistratAttachedEmails').mockResolvedValue({
      data: { items: [EMAIL] } satisfies ListedMagistratAttachedEmailsDto,
    } as never);
    renderSection();

    const list = await screen.findByRole('list', { name: 'Adresses email' });
    await within(list).findByText(EMAIL.email);
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([expect.stringMatching(/^jean\.dupont@justice\.fr/), expect.stringContaining(EMAIL.email)]);
  });

  it('offers to load the attached addresses again after a failure', async () => {
    const list = vi
      .spyOn($api.magistrats, 'listMagistratAttachedEmails')
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue({ data: { items: [EMAIL] } satisfies ListedMagistratAttachedEmailsDto } as never);
    renderSection();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByText(EMAIL.email)).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('detaches an address once confirmed', async () => {
    vi.spyOn($api.magistrats, 'listMagistratAttachedEmails').mockResolvedValue({
      data: { items: [EMAIL] } satisfies ListedMagistratAttachedEmailsDto,
    } as never);
    const detach = vi.spyOn($api.magistrats, 'detachMagistratEmail').mockResolvedValue({} as never);
    const { container } = renderSection();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: `Détacher ${EMAIL.email}` }));
    expect(await axe(container)).toHaveNoViolations();
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Détacher' }));

    await waitFor(() =>
      expect(detach).toHaveBeenCalledWith(
        expect.objectContaining({ path: { attachedEmailId: EMAIL.id, magistratId: 'magistrat-1' } }),
      ),
    );
  });
});
