import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import type { GetObservationDetailsResponseDto } from '@api/types';

import { ObservationAuditionCard } from './ObservationAuditionCard';

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSg: () => true }));
vi.mock(
  '@/features/nomination-files-table/components/cells/magistrat-side-panel/components/audition-date/AuditionDateForm',
  () => ({
    AuditionDateForm: (props: { isShared?: boolean }) =>
      props.isShared ? 'shared audition' : 'own audition',
  }),
);

const SHARED_OBSERVATION = {
  id: 'observation-1',
  observant: { audition: null, auditionScheduling: 'SCHEDULABLE' },
  observedMagistrat: { name: 'Honorine VALROSE', proposedPosition: 'Procureur général CA MONTPELLIER' },
  relatedPropositions: [
    {
      magistratName: 'Gertrude MONTFERRAND',
      observationId: 'observation-2',
      proposedPosition: 'Procureur de la République TJ LYON',
    },
  ],
} as unknown as GetObservationDetailsResponseDto;

describe('ObservationAuditionCard', () => {
  it('warns about a shared audition when editing it rather than listing the observations', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ObservationAuditionCard
          isArchived={false}
          nominationFileId="file-1"
          observation={SHARED_OBSERVATION}
          sessionId="session-1"
        />
      </IntlProvider>,
    );

    expect(screen.getByText('shared audition')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
