import { renderHook } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useAuditionExpectation } from './use-audition-expectation.hook';

const SG_ROUTE = '/secretariat-general/session/session-1';
const MEMBER_ROUTE = '/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/session-1';

const SCHEDULED = { day: 15, month: 6, year: 2029 };
const AUDITIONED = { auditionExpected: true, expectedReportersCount: 2 };

const REPORTERS: SessionNominationFile['reporters'] = [
  { id: 'user-1', firstName: 'Rachel', lastName: 'Bernard' },
  { id: 'user-2', firstName: 'Antoine', lastName: 'Roche' },
];

function renderExpectation(
  nominationFile: NominationFileOverrides,
  options: { route?: string; selectedReportersCount?: number } = {},
) {
  const { route = SG_ROUTE, selectedReportersCount } = options;

  return renderHook(
    () => useAuditionExpectation(makeSessionNominationFile(nominationFile), { selectedReportersCount }),
    {
      wrapper: ({ children }) => (
        <IntlProvider defaultLocale="fr" locale="fr">
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </IntlProvider>
      ),
    },
  ).result.current;
}

describe('useAuditionExpectation', () => {
  it('announces both the audition and the missing reporters to the secretariat', () => {
    expect(renderExpectation({ ...AUDITIONED, reporters: REPORTERS.slice(0, 1) })).toEqual({
      auditionMissing: true,
      label: 'Une audition est à prévoir et 2 rapporteurs sont attendus pour ce poste',
      reportersMissing: true,
    });
  });

  it('announces the missing reporters once the audition is scheduled', () => {
    expect(renderExpectation({ ...AUDITIONED, auditionDate: SCHEDULED, reporters: [] })).toEqual({
      auditionMissing: false,
      label: '2 rapporteurs sont attendus pour ce poste',
      reportersMissing: true,
    });
  });

  it('announces the audition only, to a member who never affects reporters', () => {
    expect(
      renderExpectation({ ...AUDITIONED, reporters: REPORTERS.slice(0, 1) }, { route: MEMBER_ROUTE }),
    ).toEqual({
      auditionMissing: true,
      label: 'Une audition est à prévoir pour ce poste',
      reportersMissing: true,
    });
  });

  it('announces nothing once the audition is scheduled and both reporters are affected', () => {
    expect(renderExpectation({ ...AUDITIONED, auditionDate: SCHEDULED, reporters: REPORTERS })).toEqual({
      auditionMissing: false,
      label: null,
      reportersMissing: false,
    });
  });

  it('announces nothing on a file that no longer accepts an audition nor an affectation', () => {
    expect(
      renderExpectation({
        ...AUDITIONED,
        canScheduleAudition: false,
        content: { isUpdatable: false },
        reporters: REPORTERS.slice(0, 1),
      }),
    ).toEqual({ auditionMissing: false, label: null, reportersMissing: false });
  });

  it('follows the reporters being selected rather than the affected ones', () => {
    expect(renderExpectation({ ...AUDITIONED, reporters: [] }, { selectedReportersCount: 2 })).toEqual({
      auditionMissing: true,
      label: 'Une audition est à prévoir pour ce poste',
      reportersMissing: false,
    });
  });
});
