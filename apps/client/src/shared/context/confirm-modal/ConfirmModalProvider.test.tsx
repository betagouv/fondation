import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { useConfirmModal } from './confirm-modal.context';
import { ConfirmModalProvider } from './ConfirmModalProvider';

function Subject(props: { i18n?: { cancel?: string; confirm?: string } }) {
  const { waitForConfirmation } = useConfirmModal();
  const [answer, setAnswer] = useState('en attente');

  return (
    <>
      <button
        onClick={async () => {
          const { isConfirmed } = await waitForConfirmation({
            content: <p>Cette action est irréversible</p>,
            i18n: props.i18n,
            title: 'Confirmer la suppression',
          });

          setAnswer(isConfirmed ? 'confirmé' : 'annulé');
        }}
        type="button"
      >
        Supprimer
      </button>

      <span>{answer}</span>
    </>
  );
}

function renderSubject(props: { i18n?: { cancel?: string; confirm?: string } } = {}) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ConfirmModalProvider>
        <Subject i18n={props.i18n} />
      </ConfirmModalProvider>
    </IntlProvider>,
  );
}

describe('ConfirmModalProvider', () => {
  it('asks nothing until a confirmation is requested', () => {
    renderSubject();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with the requested title and content', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Confirmer la suppression');
    expect(screen.getByText('Cette action est irréversible')).toBeInTheDocument();
  });

  it('resolves to a confirmation', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(await screen.findByText('confirmé')).toBeInTheDocument();
  });

  it('resolves to a refusal', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await user.click(screen.getByRole('button', { name: 'Ne rien faire' }));

    expect(await screen.findByText('annulé')).toBeInTheDocument();
  });

  it('refuses when dismissed', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(await screen.findByText('annulé')).toBeInTheDocument();
  });

  it('refuses on Escape', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(await screen.findByText('annulé')).toBeInTheDocument();
  });

  it('stays open on a backdrop click', async () => {
    const user = userEvent.setup();
    renderSubject();

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await user.click(screen.getByRole('dialog'));

    expect(screen.getByText('en attente')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('refuses a question asked over another one instead of leaving it pending', async () => {
    const user = userEvent.setup();
    const answers: string[] = [];

    function TwoQuestions() {
      const { waitForConfirmation } = useConfirmModal();

      return (
        <button
          onClick={() => {
            waitForConfirmation({ title: 'Première' }).then(({ isConfirmed }) =>
              answers.push(`première:${isConfirmed}`),
            );
            waitForConfirmation({ title: 'Seconde' }).then(({ isConfirmed }) =>
              answers.push(`seconde:${isConfirmed}`),
            );
          }}
          type="button"
        >
          Demander
        </button>
      );
    }

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ConfirmModalProvider>
          <TwoQuestions />
        </ConfirmModalProvider>
      </IntlProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Demander' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Seconde');

    await user.click(screen.getByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(answers).toEqual(['première:false', 'seconde:true']));
  });

  it('overrides the default labels', async () => {
    const user = userEvent.setup();
    renderSubject({ i18n: { cancel: 'Garder le dossier', confirm: 'Supprimer définitivement' } });

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByRole('button', { name: 'Supprimer définitivement' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Garder le dossier' })).toBeInTheDocument();
  });
});
