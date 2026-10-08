import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { NominationFilesTableContext } from '@/features/nomination-files-table/context/files-table.context';
import { frFormat } from '@/i18n/formats';
import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { AuditionDate } from './AuditionDate';

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation: vi.fn() }),
}));
vi.mock('@queries/auditions.queries', () => ({
  useNominationFileAuditionHistoryQuery: () => ({ data: { scheduled: null } }),
}));

function renderAudition(overrides: NominationFileOverrides) {
  render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <QueryClientProvider client={new QueryClient()}>
        <NominationFilesTableContext
          value={{
            canManage: true,
            formation: 'SIEGE',
            outcomes: makeSessionOutcomes('SIEGE'),
            sessionId: 'session-1',
          }}
        >
          <AuditionDate editable nominationFile={makeSessionNominationFile(overrides)} />
        </NominationFilesTableContext>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

describe('AuditionDate', () => {
  it('plans the audition a position asks for, ready to be scheduled', () => {
    renderAudition({ auditionRequired: true, auditionRequirement: 'POSITION' });

    const toggle = screen.getByRole('checkbox', { name: 'Prévoir une audition' });
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Une audition est à prévoir pour ce poste',
    );
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
  });

  it('keeps the audition a position asks for once scheduled', () => {
    renderAudition({
      auditionDate: { day: 12, month: 12, year: 2028 },
      auditionRequired: true,
      auditionRequirement: 'POSITION',
      auditionTime: { hours: 9, minutes: 30, seconds: 0 },
    });

    expect(screen.getByRole('checkbox', { name: 'Prévoir une audition' })).toBeChecked();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Une audition est à prévoir pour ce poste',
    );
  });

  it('lets the secretariat add an audition where nothing was planned', () => {
    renderAudition({ auditionRequired: false });

    expect(screen.getByRole('checkbox', { name: 'Prévoir une audition' })).not.toBeChecked();
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('keeps an added audition open to a change of mind once scheduled', () => {
    renderAudition({
      auditionDate: { day: 12, month: 12, year: 2028 },
      auditionRequired: true,
      auditionTime: { hours: 9, minutes: 30, seconds: 0 },
    });

    const toggle = screen.getByRole('checkbox', { name: 'Prévoir une audition' });
    expect(toggle).toBeChecked();
    expect(toggle).toBeEnabled();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
  });
});
