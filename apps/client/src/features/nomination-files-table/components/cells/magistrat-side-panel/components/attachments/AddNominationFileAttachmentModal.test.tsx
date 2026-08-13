import { render, screen } from '@testing-library/react';
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

const submitButton = () => screen.getByRole('button', { hidden: true, name: 'Ajouter à la proposition' });

const typeSelect = () => screen.getByRole('combobox', { hidden: true });

const TARGET = { nominationFileId: 'nf-1', sessionId: 'session-1' };

function renderModal(target: typeof TARGET | null = TARGET) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <AddNominationFileAttachmentModal target={target} />
    </IntlProvider>,
  );
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

  it('does not upload when no nomination file is targeted', async () => {
    const user = userEvent.setup();
    const { container } = renderModal(null);

    await selectFile(container, user);
    await user.selectOptions(typeSelect(), 'AUTRE');
    await user.click(submitButton());

    expect(mocks.add).not.toHaveBeenCalled();
  });

  it('passes basic accessibility checks', async () => {
    const { container } = renderModal();

    expect(await axe(container)).toHaveNoViolations();
  });
});
