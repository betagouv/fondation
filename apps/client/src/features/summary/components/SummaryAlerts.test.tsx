import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { makeSummary } from '@/shared/storybook/summary.fixtures';
import type { DetailedSummaryDto } from '@api/types';

import { SummaryAlerts } from './SummaryAlerts';

const mocks = vi.hoisted(() => ({ isSg: true }));

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSg: () => mocks.isSg }));

function renderAlerts(summary: Partial<Omit<DetailedSummaryDto, 'summary'>>) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SummaryContext
        value={{
          canWriteSummary: true,
          nominationFileId: 'nomination-file-1',
          sessionId: 'session-1',
          summary: makeSummary(summary),
        }}
      >
        <SummaryAlerts />
      </SummaryContext>
    </IntlProvider>,
  );
}

describe('SummaryAlerts', () => {
  it('warns that a summary is probably no longer needed once an outcome is set', () => {
    renderAlerts({ outcome: { comment: null, label: 'avis conforme', value: 'VALIDATED' } });

    expect(screen.getByText(/une synthèse n'est probablement plus nécessaire/)).toBeInTheDocument();
  });

  it('does not warn for a suspended decision, where a summary stays relevant', () => {
    renderAlerts({ outcome: { comment: null, label: 'sursis à statuer', value: 'SUSPENDED' } });

    expect(screen.queryByText(/une synthèse n'est probablement plus nécessaire/)).not.toBeInTheDocument();
  });

  it('reminds the secretariat of the audition and the reporters expected on the position', () => {
    mocks.isSg = true;
    renderAlerts({ auditionExpected: true, reportersMissing: true });

    expect(
      screen.getByText('Une audition est à prévoir et 2 rapporteurs sont attendus pour ce poste'),
    ).toBeInTheDocument();
  });

  it('keeps these reminders from members, who neither schedule auditions nor affect reporters', () => {
    mocks.isSg = false;
    renderAlerts({ auditionExpected: true, reportersMissing: true });

    expect(screen.queryByText(/à prévoir|rapporteurs sont attendus/)).not.toBeInTheDocument();
  });

  it('reminds the secretariat of the reporters alone once the audition is scheduled', () => {
    mocks.isSg = true;
    renderAlerts({
      auditionDate: { day: 12, month: 12, year: 2099 },
      auditionExpected: true,
      auditionTime: { hours: 12, minutes: 30, seconds: 0 },
      reportersMissing: true,
    });

    expect(screen.getByText('2 rapporteurs sont attendus pour ce poste')).toBeInTheDocument();
  });
});
