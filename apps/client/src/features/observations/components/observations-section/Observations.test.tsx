import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Observations } from './Observations';

const isSg = vi.fn(() => true);
vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => isSg() }));

const open = vi.fn();
vi.mock('@/features/observations/context/ObservationsModalContext', () => ({
  useObservationsModal: () => ({ edit: vi.fn(), open, requestDelete: vi.fn() }),
}));

const makeObservation = (id: string) => ({
  dateReception: '2025-01-10',
  description: null,
  files: [],
  followUp: null,
  id,
  magistrat: null,
});

let observations: ReturnType<typeof makeObservation>[] = [];
vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@queries/files.queries', () => ({
  useDownloadFileMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@queries/observations.queries', () => ({
  useGetObservationFileUrlMutation: () => ({ isPending: false, mutate: vi.fn() }),
  useObservationsQuery: () => ({ data: { observations } }),
}));

function renderObservations(content: { observants?: string[] | null; readOnly?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <Observations
          magistratName="RAVEL Maurice"
          nominationFileId="dossier-1"
          observers={content.observants ?? null}
          readOnly={content.readOnly}
          sessionId="session-1"
        />
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
      { id: 'dossier-1', name: 'RAVEL Maurice', sessionId: 'session-1' },
      'create',
    );
  });

  it('hides the add button from an SG when read only', () => {
    renderObservations({ observants: ['Tribunal de Lyon'], readOnly: true });

    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });

  it('hides the add button from a member', () => {
    isSg.mockReturnValue(false);
    renderObservations({ observants: ['Tribunal de Lyon'] });

    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });

  it('collapses back the observations expanded with the show more button', async () => {
    const user = userEvent.setup();
    observations = ['obs-1', 'obs-2', 'obs-3', 'obs-4'].map(makeObservation);
    renderObservations();

    await user.click(screen.getByRole('button', { name: 'Afficher plus (1)' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Afficher moins' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders nothing for a member when there is neither observer nor observation', () => {
    isSg.mockReturnValue(false);
    renderObservations();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Aucun observant sur cette proposition')).not.toBeInTheDocument();
  });
});
