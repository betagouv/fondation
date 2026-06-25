import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArchivedSessionContext } from '@/shared/context/archived-session/ArchivedSessionContext';
import * as $api from '@api/sdk';
import { authKeys } from '@queries/auth.queries';

import { MemberMemo } from './MemberMemo';

const MEMBER = { id: 'member-1', firstName: 'Jean', lastName: 'Petit', role: 'MEMBRE_DU_SIEGE' };
const SG = { id: 'sg-1', firstName: 'Anne', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };

function renderMemo(
  options: { user: typeof MEMBER; isArchived?: boolean; memo?: string | null } = { user: MEMBER },
) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  client.setQueryData(authKeys.introspectSession(), options.user);

  function Wrapper(props: { children: ReactNode }) {
    return (
      <IntlProvider defaultLocale="fr" locale="fr">
        <QueryClientProvider client={client}>
          <ArchivedSessionContext value={{ isArchived: options.isArchived ?? false, setIsArchived: vi.fn() }}>
            {props.children}
          </ArchivedSessionContext>
        </QueryClientProvider>
      </IntlProvider>
    );
  }

  return render(
    <Wrapper>
      <MemberMemo memo={options.memo ?? null} nominationFileId="file-1" sessionId="session-1" />
    </Wrapper>,
  );
}

describe('MemberMemo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders nothing for the SG', () => {
    renderMemo({ user: SG });

    expect(screen.queryByText('Commentaire')).not.toBeInTheDocument();
  });

  it('saves the typed memo on Valider', async () => {
    const write = vi
      .spyOn($api.members, 'writeNominationFileMemberMemo')
      .mockResolvedValue({} as Awaited<ReturnType<typeof $api.members.writeNominationFileMemberMemo>>);
    const user = userEvent.setup();
    renderMemo();

    await user.type(screen.getByRole('textbox'), 'Idée à garder');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { userId: MEMBER.id, sessionId: 'session-1', nominationFileId: 'file-1' },
        body: { memo: 'Idée à garder' },
      }),
    );
  });

  it('shows the memo read-only on an archived session', () => {
    renderMemo({ user: MEMBER, isArchived: true, memo: 'Note figée' });

    expect(screen.getByText('Note figée')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
  });
});
