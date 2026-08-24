import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

function renderModal(
  props: {
    actions?: React.ReactNode;
    closeOnBackdrop?: boolean;
    onClose?: () => void;
    open?: boolean;
  } = {},
) {
  const onClose = props.onClose ?? vi.fn();
  const view = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Modal
        actions={props.actions}
        closeOnBackdrop={props.closeOnBackdrop}
        onClose={onClose}
        open={props.open ?? true}
        title="Titre de la modale"
      >
        <button type="button">Action</button>
        <input aria-label="Fichier" type="file" />
      </Modal>
    </IntlProvider>,
  );

  return { onClose, view };
}

describe('Modal', () => {
  it('keeps its content unmounted while closed', () => {
    renderModal({ open: false });

    expect(screen.queryByText('Titre de la modale')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
  });

  it('opens the dialog and mounts its content', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('keeps its content mounted until the fade out ends', () => {
    vi.useFakeTimers();

    try {
      const ui = (open: boolean) => (
        <IntlProvider defaultLocale="fr" locale="fr">
          <Modal onClose={vi.fn()} open={open} title="Titre de la modale">
            <button type="button">Action</button>
          </Modal>
        </IntlProvider>
      );

      const view = render(ui(true));
      view.rerender(ui(false));
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(300));
      expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets its caller know once the fade out is over', () => {
    vi.useFakeTimers();

    try {
      const onClosed = vi.fn();
      const ui = (open: boolean) => (
        <IntlProvider defaultLocale="fr" locale="fr">
          <Modal onClose={vi.fn()} onClosed={onClosed} open={open} title="Titre de la modale">
            contenu
          </Modal>
        </IntlProvider>
      );

      const view = render(ui(true));
      view.rerender(ui(false));
      expect(onClosed).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(300));
      expect(onClosed).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('labels the dialog with its title', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Titre de la modale');
  });

  it('closes on the close button', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks to close on Escape without closing the dialog itself', () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole('dialog');

    fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute('open');
  });

  it('stays open when a file picker is dismissed', () => {
    const { onClose } = renderModal();

    fireEvent(screen.getByLabelText('Fichier'), new Event('cancel', { bubbles: true, cancelable: true }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on a backdrop click but not on a click inside the panel', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Action' }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores a backdrop click when closeOnBackdrop is false', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ closeOnBackdrop: false });

    await user.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders the actions only when one is given', () => {
    const { view } = renderModal();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();

    view.rerender(
      <IntlProvider defaultLocale="fr" locale="fr">
        <Modal
          actions={<button type="button">Enregistrer</button>}
          onClose={vi.fn()}
          open
          title="Titre de la modale"
        >
          <button type="button">Action</button>
        </Modal>
      </IntlProvider>,
    );

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
  });

  it('stacks two modals', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <Modal onClose={vi.fn()} open title="Première">
          contenu
        </Modal>
        <Modal onClose={vi.fn()} open title="Confirmation">
          confirmer ?
        </Modal>
      </IntlProvider>,
    );

    const dialogs = screen.getAllByRole('dialog');

    expect(dialogs).toHaveLength(2);
    expect(dialogs.every((dialog) => dialog.hasAttribute('open'))).toBe(true);
  });
});
