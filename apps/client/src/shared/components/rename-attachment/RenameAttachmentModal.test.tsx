import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { httpAssert } from '@/utils/http-exception';

import { RenameAttachmentModal } from './RenameAttachmentModal';

function renderModal(rename: (name: string) => Promise<unknown>) {
  const onClose = vi.fn();
  const view = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RenameAttachmentModal name="scan_0042.pdf" onClose={onClose} onClosed={vi.fn()} open rename={rename} />
    </IntlProvider>,
  );

  return { ...view, onClose };
}

const nameInput = () => screen.getByRole('textbox', { name: /Nom de la pièce jointe/ });
const submitButton = () => screen.getByRole('button', { name: 'Renommer' });

describe('RenameAttachmentModal', () => {
  it('renames the file without touching its extension, then closes', async () => {
    const user = userEvent.setup();
    const rename = vi.fn().mockResolvedValue(undefined);
    const { container, onClose } = renderModal(rename);

    expect(nameInput()).toHaveValue('scan_0042');
    expect(screen.getByText("L'extension .pdf est conservée.")).toBeInTheDocument();
    await user.clear(nameInput());
    await user.type(nameInput(), '  Avis du chef de cour ');
    await user.click(submitButton());

    expect(rename).toHaveBeenCalledWith('Avis du chef de cour');
    expect(onClose).toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not offer to rename the file to nothing', async () => {
    const user = userEvent.setup();
    renderModal(vi.fn());

    await user.clear(nameInput());
    await user.type(nameInput(), '   ');

    expect(submitButton()).toBeDisabled();
  });

  it('stops the name at 255 characters, extension included', () => {
    renderModal(vi.fn());

    expect(nameInput()).toHaveAttribute('maxLength', '251');
  });

  it('stays open on a refusal, without blaming the name', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal(async () => httpAssert(new Response(null, { status: 400 })));

    await user.click(submitButton());

    expect(
      await screen.findByText('Réessayez et prévenez le support si cela persiste (code 400).'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('tells the dossier was figé meanwhile, without advising to retry', async () => {
    const user = userEvent.setup();
    renderModal(async () => httpAssert(new Response(null, { status: 409 })));

    await user.click(submitButton());

    expect(
      await screen.findByText('Le dossier a été figé entre-temps : ses pièces jointes ne se renomment plus.'),
    ).toBeInTheDocument();
  });
});
