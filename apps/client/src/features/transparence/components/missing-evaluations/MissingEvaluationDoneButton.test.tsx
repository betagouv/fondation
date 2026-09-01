import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MissingEvaluationDoneButton } from './MissingEvaluationDoneButton';

const mutate = vi.fn();
const waitForConfirmation = vi.fn();

vi.mock('@queries/members.queries', () => ({
  useUpdateNominationFileMissingEvaluationMutation: () => ({ mutate, isPending: false }),
}));

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation }),
}));

function renderButton(disabled = false) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <MissingEvaluationDoneButton
        disabled={disabled}
        magistrat="DUPONT Marie"
        nominationFileId="dossier-1"
        sessionId="session-1"
      />
    </IntlProvider>,
  );
}

describe('MissingEvaluationDoneButton', () => {
  beforeEach(() => {
    mutate.mockClear();
    waitForConfirmation.mockClear();
  });

  it('should clear the flag once the action is confirmed', async () => {
    waitForConfirmation.mockResolvedValue({ isConfirmed: true });
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: /Marquer comme ajoutée/ }));

    expect(mutate).toHaveBeenCalledWith({
      missingEvaluation: false,
      nominationFileId: 'dossier-1',
      sessionId: 'session-1',
    });
  });

  it('should keep the flag when the action is cancelled', async () => {
    waitForConfirmation.mockResolvedValue({ isConfirmed: false });
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: /Marquer comme ajoutée/ }));

    expect(mutate).not.toHaveBeenCalled();
  });

  it('should not offer the action on a file that can no longer be updated', () => {
    renderButton(true);

    expect(screen.getByRole('button', { name: /Marquer comme ajoutée/ })).toBeDisabled();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Proposition figée : son issue est actée dans un procès-verbal ou la session est archivée',
    );
  });

  it('should not explain anything while the action is available', () => {
    renderButton();

    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });
});
