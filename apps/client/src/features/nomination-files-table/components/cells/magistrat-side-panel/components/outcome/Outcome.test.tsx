import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import type { SessionNominationFileLockedReason } from '@queries/nomination-sessions.queries';

import { Outcome } from './Outcome';

const mocks = vi.hoisted(() => ({ isSg: vi.fn(() => true) }));

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => mocks.isSg() }));

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
  useOutcomeCommentDialog: () => ({ waitForOutcomeComment: vi.fn() }),
}));

vi.mock('@queries/nomination-sessions.queries', async (orig) => ({
  ...(await orig<object>()),
  useDefineNominationFileOutcomeMutation: () => ({ mutate: vi.fn(), reset: vi.fn() }),
}));

const OUTCOME = { value: 'VALIDATED', comment: 'Avis favorable' } as const;

function renderOutcome(lockedReason: SessionNominationFileLockedReason) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Outcome nominationFile={makeSessionNominationFile({ content: { lockedReason, outcome: OUTCOME } })} />
    </IntlProvider>,
  );
}

describe('Outcome', () => {
  beforeEach(() => mocks.isSg.mockReturnValue(true));
  afterEach(() => vi.clearAllMocks());

  it('lets the secretariat general change the outcome and its comment', () => {
    renderOutcome(null);

    expect(screen.getByRole('button', { name: 'CONFORME' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('offers no action on a file that can no longer be updated', () => {
    renderOutcome('REPORTED');

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Avis favorable')).toBeVisible();
  });

  it('shows the comment to a member without letting them change it', () => {
    mocks.isSg.mockReturnValue(false);
    renderOutcome(null);

    expect(screen.getByText('Avis favorable')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
