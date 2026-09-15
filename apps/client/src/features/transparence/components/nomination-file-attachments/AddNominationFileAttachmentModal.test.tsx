import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { AddNominationFileAttachmentModal } from './AddNominationFileAttachmentModal';

const mocks = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@queries/nomination-sessions.queries', () => ({
  useAddNominationFileAttachmentsMutation: () => ({
    mutate: mocks.add,
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

const submitButton = () => screen.getByRole('button', { name: 'Ajouter à la proposition' });

const typeSelect = () => screen.getByRole('combobox');

const TARGET = { nominationFileId: 'nf-1', sessionId: 'session-1' };

function renderModal(target: typeof TARGET | null = TARGET) {
  const onClose = vi.fn();
  const view = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <AddNominationFileAttachmentModal onClose={onClose} target={target} />
    </IntlProvider>,
  );

  return { ...view, onClose };
}

async function selectFile(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, new File(['data'], 'new.pdf', { type: 'application/pdf' }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AddNominationFileAttachmentModal', () => {
  it('uploads the selected files with the chosen type', async () => {
    const user = userEvent.setup();
    const { container } = renderModal();

    await selectFile(container, user);
    await user.selectOptions(typeSelect(), 'NOTE_INTENTION');
    await user.click(submitButton());

    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ nominationFileId: 'nf-1', sessionId: 'session-1', type: 'NOTE_INTENTION' }),
      expect.any(Object),
    );
    expect(mocks.add.mock.calls[0][0].files).toHaveLength(1);
  });

  it('applies the chosen type to every file of the batch', async () => {
    const user = userEvent.setup();
    const { container } = renderModal();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ]);
    await user.selectOptions(typeSelect(), 'FICHE_DE_JURIDICTION');
    await user.click(submitButton());

    expect(mocks.add.mock.calls[0][0].files).toHaveLength(2);
    expect(mocks.add.mock.calls[0][0].type).toBe('FICHE_DE_JURIDICTION');
  });

  it('keeps the submission disabled until a type is chosen', async () => {
    const user = userEvent.setup();
    const { container } = renderModal();

    await selectFile(container, user);

    expect(submitButton()).toBeDisabled();
  });

  it('keeps the submission disabled until a file is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.selectOptions(typeSelect(), 'AUTRE');

    expect(submitButton()).toBeDisabled();
  });

  it('stays closed when no nomination file is targeted', () => {
    renderModal(null);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
  });

  it('closes and forgets the selection once the upload succeeds', async () => {
    const user = userEvent.setup();
    const { container, onClose } = renderModal();

    await selectFile(container, user);
    await user.selectOptions(typeSelect(), 'AUTRE');
    await user.click(submitButton());

    act(() => mocks.add.mock.calls[0][1].onSuccess());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(typeSelect()).toHaveValue('');
  });

  it('passes basic accessibility checks', async () => {
    const { container } = renderModal();

    expect(await axe(container)).toHaveNoViolations();
  });
});
