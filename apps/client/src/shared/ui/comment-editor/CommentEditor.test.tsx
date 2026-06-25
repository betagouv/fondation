import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { CommentEditor } from './CommentEditor';

function renderEditor(props: {
  initialValue?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
  onSave?: (value: string | null) => Promise<void>;
  readOnly?: boolean;
  warning?: boolean;
}) {
  const onSave = props.onSave ?? vi.fn().mockResolvedValue(undefined);
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <CommentEditor
        ariaLabel="Commentaire"
        emptyLabel="Aucun commentaire"
        initialValue={props.initialValue ?? null}
        onDirtyChange={props.onDirtyChange}
        onSave={onSave}
        readOnly={props.readOnly}
        warning={props.warning}
      />
    </IntlProvider>,
  );
  return { onSave };
}

describe('CommentEditor', () => {
  it('keeps the actions disabled until the value changes', async () => {
    const user = userEvent.setup();
    renderEditor({ initialValue: 'Inchangé' });

    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();

    await user.type(screen.getByRole('textbox'), '!');

    expect(screen.getByRole('button', { name: 'Valider' })).toBeEnabled();
  });

  it('saves the typed value, then clears the dirty state', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({});

    await user.type(screen.getByRole('textbox'), 'À garder');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onSave).toHaveBeenCalledExactlyOnceWith('À garder');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled());
  });

  it('saves null when the field is emptied', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({ initialValue: 'Quelque chose' });

    await user.clear(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onSave).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('cancels back to the last saved value', async () => {
    const user = userEvent.setup();
    renderEditor({ initialValue: 'Original' });

    const textbox = screen.getByRole('textbox');
    await user.type(textbox, ' modifié');
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(textbox).toHaveValue('Original');
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('surfaces an error when saving fails', async () => {
    const user = userEvent.setup();
    renderEditor({ onSave: vi.fn().mockRejectedValue(new Error('boom')) });

    await user.type(screen.getByRole('textbox'), 'Tentative');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    expect(await screen.findByText("Échec de l'enregistrement. Réessayez.")).toBeInTheDocument();
  });

  it('reports its dirty state to the parent', async () => {
    const onDirtyChange = vi.fn();
    const user = userEvent.setup();
    renderEditor({ onDirtyChange });

    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    await user.type(screen.getByRole('textbox'), 'x');

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('shows the unsaved warning when asked to', () => {
    renderEditor({ warning: true });

    expect(
      screen.getByText('Modifications non enregistrées. Cliquez sur Valider pour sauvegarder.'),
    ).toBeInTheDocument();
  });

  it('renders read-only content without controls', () => {
    renderEditor({ initialValue: 'Lecture seule', readOnly: true });

    expect(screen.getByText('Lecture seule')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument();
  });

  it('shows the empty label in read-only when there is no value', () => {
    renderEditor({ initialValue: null, readOnly: true });

    expect(screen.getByText('Aucun commentaire')).toBeInTheDocument();
  });
});
