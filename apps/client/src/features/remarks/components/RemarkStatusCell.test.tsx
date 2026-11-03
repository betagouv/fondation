import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ListedRemarksDto } from '@api/types';

import { RemarkStatusCell } from './RemarkStatusCell';
import { RemarkStatusCommentModalProvider } from './RemarkStatusCommentModalProvider';

const mutate = vi.fn();

vi.mock('@queries/remarks.queries', () => ({
  useChangeRemarkStatusMutation: () => ({ isPending: false, mutate }),
}));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn() }) }));

function renderCell(status: ListedRemarksDto['items'][number]['status']) {
  const remark = {
    author: null,
    id: 'remark-1',
    impersonated: null,
    openAs: null,
    sentAt: '2026-11-02T16:01:00.000Z',
    status,
    text: 'Ce libellé est trompeur',
    url: '/sessions',
  };
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RemarkStatusCommentModalProvider>
        <RemarkStatusCell remark={remark} />
      </RemarkStatusCommentModalProvider>
    </IntlProvider>,
  );
  return userEvent.setup();
}

describe('RemarkStatusCell', () => {
  beforeEach(() => mutate.mockReset());

  it('asks for an optional comment when dismissing a remark', async () => {
    const user = renderCell({ changedAt: null, changedBy: null, comment: null, value: 'NEW' });

    await user.click(screen.getByRole('button', { name: /Statut du retour/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Écartée' }));
    await user.type(await screen.findByLabelText(/Commentaire/), 'Déjà prévu');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mutate).toHaveBeenCalledWith(
      { comment: 'Déjà prévu', remarkId: 'remark-1', status: 'DISMISSED' },
      expect.anything(),
    );
  });

  it('sets a remark back to new without asking anything', async () => {
    const user = renderCell({
      changedAt: '2026-11-02T16:01:00.000Z',
      changedBy: { id: 'admin', name: 'Marie DUPONT' },
      comment: 'Corrigé',
      value: 'PROCESSED',
    });

    await user.click(screen.getByRole('button', { name: /Statut du retour/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Nouvelle' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mutate).toHaveBeenCalledWith(
      { comment: null, remarkId: 'remark-1', status: 'NEW' },
      expect.anything(),
    );
  });

  it('edits the comment of the current status', async () => {
    const user = renderCell({
      changedAt: '2026-11-02T16:01:00.000Z',
      changedBy: { id: 'admin', name: 'Marie DUPONT' },
      comment: 'Déjà prévu',
      value: 'DISMISSED',
    });

    const badge = screen.getByRole('button', { name: /Statut du retour/ });
    expect(badge).toHaveAccessibleName(/par Marie DUPONT : Déjà prévu$/);
    await user.click(badge);
    await user.click(await screen.findByRole('menuitem', { name: 'Modifier le commentaire' }));
    const field = await screen.findByLabelText(/Commentaire/);
    expect(field).toHaveValue('Déjà prévu');
    await user.type(field, ' dans FON-650');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mutate).toHaveBeenCalledWith(
      { comment: 'Déjà prévu dans FON-650', remarkId: 'remark-1', status: 'DISMISSED' },
      expect.anything(),
    );
  });
});
