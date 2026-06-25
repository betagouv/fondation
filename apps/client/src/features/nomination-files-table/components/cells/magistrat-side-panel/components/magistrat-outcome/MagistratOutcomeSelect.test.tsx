import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { MagistratOutcomeSelect } from './MagistratOutcomeSelect';

const mocks = vi.hoisted(() => ({
  waitForOutcomeComment: vi.fn(),
  mutate: vi.fn(),
  reset: vi.fn(),
  remind: vi.fn(),
}));

vi.mock('@/features/nomination-files-table/context/files-table.context', () => ({
  useNominationFilesTable: () => ({ formation: 'SIEGE', sessionId: 'session-1' }),
}));

vi.mock('../../../nomination-file-outcome/nomination-file-outcome-badge.utils', async (orig) => ({
  ...(await orig<object>()),
  useSortedNominationFileOutcomes: () => ['VALIDATED', 'NON_VALIDATED'],
}));

vi.mock('../../../nomination-file-outcome/OutcomeCommentModalContext', () => ({
  useOutcomeCommentDialog: () => ({ waitForOutcomeComment: mocks.waitForOutcomeComment }),
}));

vi.mock('../../../observation-follow-up/useObservationFollowUpReminderModal.hook', () => ({
  useObservationFollowUpReminderModal: () => ({
    remindOfObservationFollowUpIfNecessary: mocks.remind,
  }),
}));

vi.mock('@queries/nomination-sessions.queries', async (orig) => ({
  ...(await orig<object>()),
  useDefineNominationFileOutcomeMutation: () => ({ mutate: mocks.mutate, reset: mocks.reset }),
}));

function renderSelect() {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <MagistratOutcomeSelect nominationFile={makeSessionNominationFile()} />
    </IntlProvider>,
  );
}

describe('MagistratOutcomeSelect', () => {
  beforeEach(() => {
    mocks.mutate.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.();
      opts?.onSettled?.();
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('clears the outcome without opening the comment dialog', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('button', { name: 'Aucune' }));

    expect(mocks.waitForOutcomeComment).not.toHaveBeenCalled();
    expect(mocks.mutate).toHaveBeenCalledWith({ comment: null, outcome: null });
  });

  it('saves the outcome and reminds about follow-up when a comment is confirmed', async () => {
    mocks.waitForOutcomeComment.mockResolvedValue({ type: 'comment', value: 'Bien' });
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('button', { name: 'CONFORME' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).toHaveBeenCalledWith({ comment: 'Bien', outcome: 'VALIDATED' }, expect.anything());
    expect(mocks.remind).toHaveBeenCalledTimes(1);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('drops the change without saving when the dialog is cancelled', async () => {
    mocks.waitForOutcomeComment.mockResolvedValue({ type: 'drop' });
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button', { name: 'Sélectionner' }));
    await user.click(await screen.findByRole('button', { name: 'CONFORME' }));

    await waitFor(() => expect(mocks.reset).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
