import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

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

function renderOutcome(isUpdatable: boolean) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Outcome nominationFile={makeSessionNominationFile({ content: { isUpdatable, outcome: OUTCOME } })} />
    </IntlProvider>,
  );
}

describe('Outcome', () => {
  afterEach(() => vi.clearAllMocks());

  it('lets the secretariat general change the outcome and its comment', () => {
    renderOutcome(true);

    expect(screen.getByRole('button', { name: 'CONFORME' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('offers no action on a file that can no longer be updated', () => {
    renderOutcome(false);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Avis favorable')).toBeVisible();
  });
});
