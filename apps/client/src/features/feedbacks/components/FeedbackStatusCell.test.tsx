import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ListedFeedbacksDto } from '@api/types';

import { FeedbackStatusCell } from './FeedbackStatusCell';
import { FeedbackStatusCommentModalProvider } from './FeedbackStatusCommentModalProvider';

const mutate = vi.fn();

vi.mock('@queries/feedbacks.queries', () => ({
  useChangeFeedbackStatusMutation: () => ({ isPending: false, mutate }),
}));
vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn() }) }));

function renderCell(status: ListedFeedbacksDto['items'][number]['status']) {
  const feedback = {
    author: null,
    id: 'feedback-1',
    impersonated: null,
    openAs: null,
    sentAt: '2026-11-02T16:01:00.000Z',
    status,
    text: 'Ce libellé est trompeur',
    url: '/sessions',
  };
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <FeedbackStatusCommentModalProvider>
        <FeedbackStatusCell feedback={feedback} />
      </FeedbackStatusCommentModalProvider>
    </IntlProvider>,
  );
  return userEvent.setup();
}

describe('FeedbackStatusCell', () => {
  beforeEach(() => mutate.mockReset());

  it('asks for an optional comment when dismissing a feedback', async () => {
    const user = renderCell({ changedAt: null, changedBy: null, comment: null, value: 'NEW' });

    await user.click(screen.getByRole('button', { name: /Statut du retour/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Écarté' }));
    await user.type(await screen.findByLabelText(/Commentaire/), 'Déjà prévu');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mutate).toHaveBeenCalledWith(
      { comment: 'Déjà prévu', feedbackId: 'feedback-1', status: 'DISMISSED' },
      expect.anything(),
    );
  });

  it('keeps the comment of the previous status when changing status', async () => {
    const user = renderCell({
      changedAt: '2026-11-02T16:01:00.000Z',
      changedBy: { id: 'admin', name: 'Marie DUPONT' },
      comment: 'FON-771',
      value: 'ACKNOWLEDGED',
    });

    await user.click(screen.getByRole('button', { name: /Statut du retour/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Traité' }));
    expect(await screen.findByLabelText(/Commentaire/)).toHaveValue('FON-771');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mutate).toHaveBeenCalledWith(
      { comment: 'FON-771', feedbackId: 'feedback-1', status: 'PROCESSED' },
      expect.anything(),
    );
  });

  it('sets a feedback back to new without asking anything', async () => {
    const user = renderCell({
      changedAt: '2026-11-02T16:01:00.000Z',
      changedBy: { id: 'admin', name: 'Marie DUPONT' },
      comment: 'Corrigé',
      value: 'PROCESSED',
    });

    await user.click(screen.getByRole('button', { name: /Statut du retour/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Nouveau' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mutate).toHaveBeenCalledWith(
      { comment: null, feedbackId: 'feedback-1', status: 'NEW' },
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
    await user.click(await screen.findByRole('menuitem', { name: /Écarté.*modifier le commentaire/ }));
    const field = await screen.findByLabelText(/Commentaire/);
    expect(field).toHaveValue('Déjà prévu');
    await user.type(field, ' dans FON-650');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mutate).toHaveBeenCalledWith(
      { comment: 'Déjà prévu dans FON-650', feedbackId: 'feedback-1', status: 'DISMISSED' },
      expect.anything(),
    );
  });
});
