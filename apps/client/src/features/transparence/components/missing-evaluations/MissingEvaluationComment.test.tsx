import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MissingEvaluationCommentCell, MissingEvaluationCommentProvider } from './MissingEvaluationComment';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), isError: false }));

vi.mock('@queries/members.queries', () => ({
  useUpdateNominationFileMissingEvaluationCommentMutation: () => ({
    mutate: mocks.mutate,
    isPending: false,
    isError: mocks.isError,
  }),
}));

const editor = () => screen.getByRole('textbox', { name: /Suivi de l’évaluation manquante de DUPONT Marie/ });

const saveButton = () => screen.getByRole('button', { name: 'Enregistrer' });

function renderCell(props: { comment?: string | null; disabled?: boolean } = {}) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <MissingEvaluationCommentProvider sessionId="session-1">
        <MissingEvaluationCommentCell
          comment={props.comment ?? null}
          disabled={props.disabled ?? false}
          magistrat="DUPONT Marie"
          nominationFileId="dossier-1"
        />
      </MissingEvaluationCommentProvider>
    </IntlProvider>,
  );
}

beforeEach(() => {
  mocks.mutate.mockClear();
  mocks.isError = false;
});

describe('MissingEvaluationCommentCell', () => {
  it('should invite to add a comment when there is none', () => {
    renderCell();

    expect(screen.getByRole('button', { name: 'Ajouter un commentaire pour DUPONT Marie' })).toBeEnabled();
  });

  it('should show the whole comment next to an edit button naming the magistrat', () => {
    const { container } = renderCell({ comment: 'Relancée le 12 août' });

    expect(container).toHaveTextContent('Relancée le 12 août Modifier');
    expect(screen.getByRole('button', { name: 'Modifier le commentaire de DUPONT Marie' })).toBeEnabled();
  });

  it('should show the comment as plain text on a file that can no longer be updated', () => {
    renderCell({ comment: 'Relancée le 12 août', disabled: true });

    expect(screen.getByText('Relancée le 12 août')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Relancée/ })).not.toBeInTheDocument();
  });
});

describe('MissingEvaluationCommentModal', () => {
  it('should save the comment typed for the edited file', async () => {
    const user = userEvent.setup();
    renderCell();

    await user.click(screen.getByRole('button', { name: 'Ajouter un commentaire pour DUPONT Marie' }));
    await user.type(editor(), '  Relancée le 12 août  ');
    await user.click(saveButton());

    expect(mocks.mutate).toHaveBeenCalledWith(
      { comment: 'Relancée le 12 août', nominationFileId: 'dossier-1', sessionId: 'session-1' },
      expect.any(Object),
    );
  });

  it('should drop the comment once the editor is emptied', async () => {
    const user = userEvent.setup();
    renderCell({ comment: 'Relancée le 12 août' });

    await user.click(screen.getByRole('button', { name: 'Modifier le commentaire de DUPONT Marie' }));
    await user.clear(editor());
    await user.click(saveButton());

    expect(mocks.mutate).toHaveBeenCalledWith(
      { comment: null, nominationFileId: 'dossier-1', sessionId: 'session-1' },
      expect.any(Object),
    );
  });

  it('should report a failed save without closing the editor', async () => {
    mocks.isError = true;
    const user = userEvent.setup();
    renderCell();

    await user.click(screen.getByRole('button', { name: 'Ajouter un commentaire pour DUPONT Marie' }));

    expect(screen.getByRole('alert')).toHaveTextContent("L'enregistrement a échoué");
  });
});
