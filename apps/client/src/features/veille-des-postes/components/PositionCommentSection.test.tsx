import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';
import * as $api from '@api/sdk';
import type { FoundPositionCommentDto } from '@api/types';
import { authKeys } from '@queries/auth.queries';
import type { CommentedPosition } from '@queries/veille-des-postes.queries';

import { PositionCommentSection } from './PositionCommentSection';

const ME = { firstName: 'Anne', id: 'me', lastName: 'Roy', role: 'ADJOINT_SECRETAIRE_GENERAL' };

/** what the client of the API answers as the component reads it */
function found(comment: string | null): never {
  const lastChange =
    comment === null ? null : { at: new Date().toISOString(), by: { id: ME.id, name: 'Anne ROY' } };
  return { data: { comment, lastChange, maxLength: 50_000 } satisfies FoundPositionCommentDto } as never;
}

function notFound(): unknown {
  try {
    httpAssert(new Response(null, { status: 404 }));
  } catch (error) {
    return error;
  }
}

function renderSection(position: CommentedPosition = { magistratId: 'magistrat' }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  client.setQueryData(authKeys.introspectSession(), ME);
  const onDirtyChange = vi.fn();

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <PositionCommentSection onDirtyChange={onDirtyChange} position={position} />
      </QueryClientProvider>
    </IntlProvider>,
  );

  return { client, onDirtyChange };
}

describe('PositionCommentSection', () => {
  afterEach(() => vi.restoreAllMocks());

  it('frees the side panel once the comment is gone even with a change typed', async () => {
    const find = vi.spyOn($api.veilleDesPostes, 'findPositionComment').mockResolvedValue(found(null));
    const { client, onDirtyChange } = renderSection();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), 'Souhaite partir');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    find.mockRejectedValue(notFound());
    await client.invalidateQueries();

    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
    expect(screen.queryByRole('textbox', { name: 'Commentaire' })).not.toBeInTheDocument();
  });

  it('reads and writes the comment of a court on the path of its court', async () => {
    vi.spyOn($api.veilleDesPostes, 'findCourtComment').mockResolvedValue(found(null));
    const write = vi.spyOn($api.veilleDesPostes, 'writeCourtComment').mockResolvedValue({} as never);
    renderSection({ courtId: 'TJ  GRASSE' });
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), 'Intérim');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() =>
      expect(write).toHaveBeenCalledWith(
        expect.objectContaining({ body: { comment: 'Intérim' }, path: { courtId: 'TJ  GRASSE' } }),
      ),
    );
  });

  it('shows the comment trimmed as the API saved it', async () => {
    const find = vi.spyOn($api.veilleDesPostes, 'findPositionComment').mockResolvedValue(found(null));
    vi.spyOn($api.veilleDesPostes, 'writePositionComment').mockImplementation(async () => {
      find.mockResolvedValue(found('Souhaite partir'));
      return {} as never;
    });
    renderSection();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), '  Souhaite partir  ');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Commentaire' })).toHaveValue('Souhaite partir'),
    );
  });

  it('starts empty again once spaces only erased the comment', async () => {
    vi.spyOn($api.veilleDesPostes, 'findPositionComment').mockResolvedValue(found(null));
    vi.spyOn($api.veilleDesPostes, 'writePositionComment').mockResolvedValue({} as never);
    renderSection();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Commentaire' })).toHaveValue(''));
  });
});
