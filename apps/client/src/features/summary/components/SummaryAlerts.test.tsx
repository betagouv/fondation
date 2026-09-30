import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { makeSummary } from '@/shared/storybook/summary.fixtures';

import { SummaryAlerts } from './SummaryAlerts';

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSg: () => true }));

function renderAlerts(outcome: { label: string; value: 'SUSPENDED' | 'VALIDATED' }) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SummaryContext
        value={{
          canWriteSummary: true,
          nominationFileId: 'nomination-file-1',
          sessionId: 'session-1',
          summary: makeSummary({ outcome: { comment: null, ...outcome } }),
        }}
      >
        <SummaryAlerts />
      </SummaryContext>
    </IntlProvider>,
  );
}

describe('SummaryAlerts', () => {
  it('warns that a summary is probably no longer needed once an outcome is set', () => {
    renderAlerts({ label: 'avis conforme', value: 'VALIDATED' });

    expect(screen.getByText(/une synthèse n'est probablement plus nécessaire/)).toBeInTheDocument();
  });

  it('does not warn for a suspended decision, where a summary stays relevant', () => {
    renderAlerts({ label: 'sursis à statuer', value: 'SUSPENDED' });

    expect(screen.queryByText(/une synthèse n'est probablement plus nécessaire/)).not.toBeInTheDocument();
  });
});
