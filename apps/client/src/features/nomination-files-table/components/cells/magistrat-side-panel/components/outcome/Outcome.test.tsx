import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../recused-members/RecusedMembers', () => ({ RecusedMembers: () => <p>Membres déportés</p> }));

vi.mock('@queries/nomination-sessions.queries', async (orig) => ({
  ...(await orig<object>()),
  useDefineNominationFileOutcomeMutation: () => ({ mutate: vi.fn(), reset: vi.fn() }),
}));

const OUTCOME = { value: 'VALIDATED', comment: 'Avis favorable' } as const;

function renderOutcome(canUpdate: boolean) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Outcome nominationFile={makeSessionNominationFile({ canUpdate, content: { outcome: OUTCOME } })} />
    </IntlProvider>,
  );
}

describe('Outcome', () => {
  beforeEach(() => mocks.isSg.mockReturnValue(true));
  afterEach(() => vi.clearAllMocks());

  it('lets the secretariat general change the outcome and its comment', () => {
    renderOutcome(true);

    expect(screen.getByRole('button', { name: "Ajouter l'issue CONFORME" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('offers no action on a file that can no longer be updated', () => {
    renderOutcome(false);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Avis favorable')).toBeVisible();
  });

  it('gathers the recusal with the outcome for the secretariat general', () => {
    renderOutcome(true);

    expect(screen.getByRole('heading', { name: 'Déport et issue' })).toBeVisible();
    expect(screen.getByText('Membres déportés')).toBeVisible();
  });

  it('shows a member the outcome alone, the recused members being listed under the reporters', () => {
    mocks.isSg.mockReturnValue(false);
    renderOutcome(false);

    expect(screen.getByRole('heading', { name: 'Issue' })).toBeVisible();
    expect(screen.queryByText('Membres déportés')).not.toBeInTheDocument();
  });

  it('shows the comment in the member space without letting change it, even to an admin the API lets update the file', () => {
    mocks.isSg.mockReturnValue(false);
    renderOutcome(true);

    expect(screen.getByText('Avis favorable')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
