import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { OutcomeSelect } from './OutcomeSelect';

const mocks = vi.hoisted(() => ({
  waitForOutcomeComment: vi.fn(),
  mutate: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/features/nomination-files-table/context/files-table.context', async () => {
  const { makeSessionOutcomes } = await import('@/test-utils/factories/session-outcomes.factory');

  return {
    useNominationFilesTable: () => ({
      formation: 'SIEGE',
      sessionId: 'session-1',
      outcomes: makeSessionOutcomes('SIEGE'),
    }),
  };
});

vi.mock('../../../nomination-file-outcome/OutcomeCommentModalContext', () => ({
  useOutcomeCommentDialog: () => ({ waitForOutcomeComment: mocks.waitForOutcomeComment }),
}));

vi.mock('@queries/nomination-sessions.queries', async (orig) => ({
  ...(await orig<object>()),
  useDefineNominationFileOutcomeMutation: () => ({ mutate: mocks.mutate, reset: mocks.reset }),
}));

function renderSelect(overrides?: Parameters<typeof makeSessionNominationFile>[0]) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <OutcomeSelect nominationFile={makeSessionNominationFile(overrides)} />
    </IntlProvider>,
  );
}

describe('OutcomeSelect', () => {
  beforeEach(() => {
    mocks.mutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
      opts?.onSettled?.();
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('clears the active outcome without opening the comment dialog', async () => {
    const user = userEvent.setup();
    renderSelect({ content: { outcome: { value: 'VALIDATED', comment: null } } });

    await user.click(screen.getByRole('button', { name: 'CONFORME' }));
    await user.click(await screen.findByRole('option', { name: 'CONFORME' }));

    expect(mocks.waitForOutcomeComment).not.toHaveBeenCalled();
    expect(mocks.mutate).toHaveBeenCalledWith({ comment: null, outcome: null });
  });

  it('saves an outcome that needs no comment without opening the comment dialog', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('option', { name: 'CONFORME' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.waitForOutcomeComment).not.toHaveBeenCalled();
    expect(mocks.mutate).toHaveBeenCalledWith({ comment: null, outcome: 'VALIDATED' }, expect.anything());
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('saves the outcome when a required comment is confirmed', async () => {
    mocks.waitForOutcomeComment.mockResolvedValue({ type: 'comment', value: 'Bien' });
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('option', { name: 'NON CONFORME' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.waitForOutcomeComment).toHaveBeenCalledWith('NON_VALIDATED', null);
    expect(mocks.mutate).toHaveBeenCalledWith(
      { comment: 'Bien', outcome: 'NON_VALIDATED' },
      expect.anything(),
    );
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('keeps the current comment when the new outcome needs none', async () => {
    const user = userEvent.setup();
    renderSelect({ content: { outcome: { value: 'NON_VALIDATED', comment: 'Déjà écrit' } } });

    await user.click(screen.getByRole('button', { name: 'NON CONFORME' }));
    await user.click(await screen.findByRole('option', { name: 'CONFORME' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { comment: 'Déjà écrit', outcome: 'VALIDATED' },
      expect.anything(),
    );
  });

  it('prefills the dialog with the current comment when the new outcome needs one', async () => {
    mocks.waitForOutcomeComment.mockResolvedValue({ type: 'comment', value: 'Corrigé' });
    const user = userEvent.setup();
    renderSelect({ content: { outcome: { value: 'VALIDATED', comment: 'Déjà écrit' } } });

    await user.click(screen.getByRole('button', { name: 'CONFORME' }));
    await user.click(await screen.findByRole('option', { name: 'NON CONFORME' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.waitForOutcomeComment).toHaveBeenCalledWith('NON_VALIDATED', 'Déjà écrit');
  });

  it('drops the change without saving when the dialog is cancelled', async () => {
    mocks.waitForOutcomeComment.mockResolvedValue({ type: 'drop' });
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('option', { name: 'NON CONFORME' }));

    await waitFor(() => expect(mocks.reset).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
