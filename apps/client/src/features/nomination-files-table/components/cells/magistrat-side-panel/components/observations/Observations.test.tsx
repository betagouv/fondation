import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { Observations } from './Observations';

const isSg = vi.fn(() => true);
vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => isSg() }));

const open = vi.fn();
vi.mock('../../../observations/context/ObservationsModalContext', () => ({
  useObservationsModal: () => ({ open, edit: vi.fn(), requestDelete: vi.fn() }),
}));

const makeObservation = (id: string) => ({
  id,
  description: null,
  dateReception: '2025-01-10',
  followUp: null,
  magistrat: null,
  files: [],
});

let observations: ReturnType<typeof makeObservation>[] = [];
vi.mock('@queries/observations.queries', () => ({
  useObservationsQuery: () => ({ data: { observations } }),
  useGetObservationFileUrlMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderObservations(content: { observants?: string[] | null } = {}) {
  const nominationFile = makeSessionNominationFile({ content: { observants: content.observants ?? null } });
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <Observations nominationFile={nominationFile} sessionId="session-1" />
      </IntlProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  isSg.mockReturnValue(true);
  observations = [];
});

describe('Observations', () => {
  it('shows the empty state when there is neither observer nor observation', () => {
    renderObservations();

    expect(screen.getByText('Aucun observant sur cette proposition')).toBeInTheDocument();
  });

  it('uses the singular heading without the count for a single observation', () => {
    observations = [makeObservation('obs-1')];
    renderObservations({ observants: ['Tribunal de Lyon'] });

    expect(screen.getByRole('heading', { name: 'Observant' })).toBeInTheDocument();
    expect(screen.getByText('Tribunal de Lyon')).toBeInTheDocument();
  });

  it('uses the plural heading with the count for several observations', () => {
    observations = [makeObservation('obs-1'), makeObservation('obs-2')];
    renderObservations({ observants: ['Tribunal de Lyon'] });

    expect(screen.getByRole('heading', { name: 'Observants (2)' })).toBeInTheDocument();
  });

  it('uses the plural heading without count when no observation is received yet', () => {
    renderObservations({ observants: ['Tribunal de Lyon', 'Cour de Paris'] });

    expect(screen.getByRole('heading', { name: 'Observants' })).toBeInTheDocument();
  });

  it('lets an SG add an observation', async () => {
    const user = userEvent.setup();
    renderObservations();

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(open).toHaveBeenCalledWith(
      { sessionId: 'session-1', id: 'nomination-file', name: 'Camille DURAND' },
      'create',
    );
  });

  it('hides the add button from a member', () => {
    isSg.mockReturnValue(false);
    renderObservations({ observants: ['Tribunal de Lyon'] });

    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });

  it('renders nothing for a member when there is neither observer nor observation', () => {
    isSg.mockReturnValue(false);
    renderObservations();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Aucun observant sur cette proposition')).not.toBeInTheDocument();
  });
});
