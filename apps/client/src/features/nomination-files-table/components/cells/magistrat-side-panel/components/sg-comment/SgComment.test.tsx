import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArchivedSessionContext } from '@/shared/context/archived-session/ArchivedSessionContext';
import * as $api from '@api/sdk';
import { authKeys } from '@queries/auth.queries';

import { SgComment } from './SgComment';

const SG = { id: 'sg-1', firstName: 'Anne', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };
const MEMBER = { id: 'm-1', firstName: 'Jean', lastName: 'Petit', role: 'MEMBRE_COMMUN' };

function renderComment(options: { user: typeof SG; isArchived?: boolean; initialComment?: string | null }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  client.setQueryData(authKeys.introspectSession(), options.user);

  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <ArchivedSessionContext value={{ isArchived: options.isArchived ?? false, setIsArchived: vi.fn() }}>
          <MemoryRouter initialEntries={['/sessions/session-1']}>
            <Routes>
              <Route
                element={
                  <SgComment initialComment={options.initialComment ?? null} nominationFileId="file-1" />
                }
                path="/sessions/:sessionId"
              />
            </Routes>
          </MemoryRouter>
        </ArchivedSessionContext>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('SgComment visibility', () => {
  it('shows the editable form to the SG', () => {
    renderComment({ user: SG });

    expect(screen.getByText('Complément SG')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
  });

  it('shows a read-only comment to a member when one exists', () => {
    renderComment({ user: MEMBER, initialComment: 'Avis du SG' });

    expect(screen.getByText('Avis du SG')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
  });

  it('renders nothing for a member when there is no comment', () => {
    renderComment({ user: MEMBER, initialComment: null });

    expect(screen.queryByText('Complément SG')).not.toBeInTheDocument();
  });

  it('renders nothing on an archived session, even for the SG', () => {
    renderComment({ user: SG, isArchived: true });

    expect(screen.queryByText('Complément SG')).not.toBeInTheDocument();
  });
});

describe('SgComment edition', () => {
  afterEach(() => vi.restoreAllMocks());

  it('saves the typed comment on Valider', async () => {
    const update = vi
      .spyOn($api.sessions, 'updateNominationFileComment')
      .mockResolvedValue({} as Awaited<ReturnType<typeof $api.sessions.updateNominationFileComment>>);
    const user = userEvent.setup();
    renderComment({ user: SG });

    await user.type(screen.getByRole('textbox'), 'Profil solide');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { sessionId: 'session-1', nominationFileId: 'file-1' },
        body: { comment: 'Profil solide' },
      }),
    );
  });

  it('keeps the Valider button disabled until the comment changes', () => {
    renderComment({ user: SG, initialComment: 'Inchangé' });

    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });
});
