import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import * as $api from '@api/sdk';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

import { CallForApplicationsActions } from './CallForApplicationsActions';

const CALL: CallForApplications = {
  canChange: true,
  comment: null,
  createdOn: { day: 20, month: 11, year: 2026 },
  deadline: null,
  guidelinesAdaptations: [],
  guidelinesAdaptationsLabel: null,
  history: [],
  id: 'call-1',
  publishedOn: null,
  status: { id: 'UNPUBLISHED', label: 'Non publié' },
  targetCourts: [],
  targetLabel: "Cours d'appel et tribunaux judiciaires",
  targetPositions: [],
  type: { id: 'GENERAL', label: 'Général' },
};

function renderActions(call: CallForApplications) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ConfirmModalProvider>
            <CallForApplicationsActions call={call} />
          </ConfirmModalProvider>
        </ToastProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('CallForApplicationsActions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('offers only the history on a call the user may no longer change', () => {
    renderActions({ ...CALL, canChange: false });

    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      "Voir l'historique de l'appel à candidatures",
    ]);
  });

  it('deletes the call once the deletion is confirmed', async () => {
    const remove = vi
      .spyOn($api.callsForApplications, 'deleteCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    renderActions(CALL);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: "Supprimer l'appel à candidatures" }));
    expect(remove).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: 'Supprimer' }));

    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ path: { callId: 'call-1' } }));
  });
});
