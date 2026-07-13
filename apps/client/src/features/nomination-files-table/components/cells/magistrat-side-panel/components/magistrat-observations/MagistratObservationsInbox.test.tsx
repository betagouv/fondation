import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import type { Observation } from '@queries/observations.queries';

import { MagistratObservationsInbox } from './MagistratObservationsInbox';

const isSg = vi.fn(() => true);
vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => isSg() }));

const open = vi.fn();
vi.mock('../../../observations/context/ObservationsModalContext', () => ({
  useObservationsModal: () => ({ open, edit: vi.fn(), requestDelete: vi.fn() }),
}));

let observations: Observation[] = [];
vi.mock('@queries/observations.queries', () => ({
  useObservationsQuery: () => ({ data: { observations } }),
  useGetObservationFileUrlMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function makeObservation(overrides: Partial<Observation> & Pick<Observation, 'id'>): Observation {
  return {
    createdAt: '2026-07-13',
    createdBy: { firstName: 'Anne', id: 'user-1', lastName: 'Roy' },
    dateReception: '2026-07-02',
    description: 'Observation',
    files: [],
    followUp: null,
    magistrat: {
      currentPosition: null,
      firstName: 'Léa',
      id: 'magistrat-1',
      lastName: 'Martin',
      usedName: null,
    },
    ...overrides,
  };
}

const MARTIN = makeObservation({ id: 'observation-1' });
const DUPONT = makeObservation({
  description: 'Observation de Dupont',
  id: 'observation-2',
  magistrat: {
    currentPosition: null,
    firstName: 'Marc',
    id: 'magistrat-2',
    lastName: 'Dupont',
    usedName: null,
  },
});

function renderInbox(content: { observants?: string[] | null } = {}) {
  const nominationFile = makeSessionNominationFile({ content: { observants: content.observants ?? null } });
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <MagistratObservationsInbox nominationFile={nominationFile} sessionId="session-1" />
      </IntlProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  isSg.mockReturnValue(true);
  observations = [];
});

describe('MagistratObservationsInbox', () => {
  it('shows the empty state when there is neither observer nor observation', () => {
    renderInbox();

    expect(screen.getByText('Aucun observant sur cette proposition')).toBeInTheDocument();
  });

  it('uses the singular heading for a single observer', () => {
    renderInbox({ observants: ['Tribunal de Lyon'] });

    expect(screen.getByRole('heading', { name: 'Observant' })).toBeInTheDocument();
    expect(screen.getByText('Tribunal de Lyon')).toBeInTheDocument();
  });

  it('uses the plural heading when several observers are present', () => {
    renderInbox({ observants: ['Tribunal de Lyon', 'Cour de Paris'] });

    expect(screen.getByRole('heading', { name: 'Observants' })).toBeInTheDocument();
  });

  it('lets an SG add an observation', async () => {
    const user = userEvent.setup();
    renderInbox();

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(open).toHaveBeenCalledWith(
      { sessionId: 'session-1', id: 'nomination-file', name: 'Camille DURAND' },
      'create',
    );
  });

  it('hides the add button from a member', () => {
    isSg.mockReturnValue(false);
    renderInbox({ observants: ['Tribunal de Lyon'] });

    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
  });

  it('renders nothing for a member when there is neither observer nor observation', () => {
    isSg.mockReturnValue(false);
    renderInbox();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Aucun observant sur cette proposition')).not.toBeInTheDocument();
  });

  it('selects the first observation by default', () => {
    observations = [MARTIN, DUPONT];
    renderInbox();

    const [first, second] = screen.getAllByRole('tab');

    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(second).toHaveAttribute('aria-selected', 'false');
  });

  it('leaves a single tab stop in the list', () => {
    observations = [MARTIN, DUPONT];
    renderInbox();

    const [first, second] = screen.getAllByRole('tab');

    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
  });

  it('opens the panel of the clicked observation and deactivates the other one', async () => {
    const user = userEvent.setup();
    observations = [MARTIN, DUPONT];
    renderInbox();

    await user.click(screen.getByRole('tab', { name: /DUPONT/ }));

    expect(screen.getByRole('tab', { name: /DUPONT/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /DUPONT/ })).not.toHaveAttribute('inert');
    expect(screen.getByRole('tabpanel', { name: /MARTIN/ })).toHaveAttribute('inert');
  });

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup();
    observations = [MARTIN, DUPONT];
    renderInbox();

    screen.getByRole('tab', { name: /MARTIN/ }).focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('tab', { name: /DUPONT/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /DUPONT/ })).toHaveFocus();
  });

  it('wraps around at the start of the list', async () => {
    const user = userEvent.setup();
    observations = [MARTIN, DUPONT];
    renderInbox();

    screen.getByRole('tab', { name: /MARTIN/ }).focus();
    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('tab', { name: /DUPONT/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('announces the text and attachment hints to assistive technology', () => {
    observations = [makeObservation({ files: [{ id: 'file-1', name: 'note.pdf' }], id: 'observation-1' })];
    renderInbox();

    const tab = screen.getByRole('tab');

    expect(within(tab).getByText('Contient un texte')).toBeInTheDocument();
    expect(within(tab).getByText('Contient une pièce jointe')).toBeInTheDocument();
  });

  it('tells the reader when an observation carries no content', () => {
    observations = [makeObservation({ description: '', files: [], id: 'observation-1' })];
    renderInbox();

    expect(screen.getByText('Aucun contenu transmis pour cette observation')).toBeInTheDocument();
  });
});
