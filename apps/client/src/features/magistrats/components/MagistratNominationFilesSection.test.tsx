import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { MagistratNominationFilesSection } from './MagistratNominationFilesSection';
import type { MagistratNominationFile } from './MagistratNominationFilesTable';

vi.stubGlobal(
  'ResizeObserver',
  class {
    disconnect() {}
    observe() {}
    unobserve() {}
  },
);

const fetchNextPage = vi.fn();
let query: {
  data: { pages: { items: MagistratNominationFile[] }[] } | undefined;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
};

vi.mock('@queries/magistrats.queries', () => ({
  useMagistratNominationFilesQuery: () => ({ ...query, fetchNextPage }),
}));

function makeNominationFile(overrides?: Partial<MagistratNominationFile>): MagistratNominationFile {
  return {
    auditionDate: null,
    auditionRequired: false,
    auditionTime: null,
    canScheduleAudition: true,
    id: 'dossier-1',
    name: 'VALROSE Honorine',
    number: 12,
    outcome: null,
    reporters: [],
    session: {
      canOpen: true,
      date: { day: 20, month: 2, year: 2026 },
      formation: 'SIEGE',
      id: 'session-1',
      name: 'Transparence Annuelle 2026',
      status: 'ONGOING',
    },
    targetedGrade: 'G3',
    targetedPosition: 'Président de chambre CA AIX EN PROVENCE',
    ...overrides,
  };
}

function renderSection() {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter>
        <MagistratNominationFilesSection context="sg" magistratId="magistrat-1" />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('MagistratNominationFilesSection', () => {
  beforeEach(() => {
    // jsdom lays nothing out: the virtualized table only renders rows once its box has a height
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 320 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 800 });
    fetchNextPage.mockClear();
    query = { data: undefined, hasNextPage: false, isFetchingNextPage: false, isLoading: false };
  });

  it('shows the empty message when the magistrat has no nomination file', () => {
    renderSection();

    expect(screen.getByText('Aucune proposition')).toBeInTheDocument();
    expect(screen.queryByText('Voir plus')).not.toBeInTheDocument();
  });

  it('shows a loading state while fetching', () => {
    query = { ...query, isLoading: true };
    renderSection();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByText('Aucune proposition')).not.toBeInTheDocument();
  });

  it('announces the audition to schedule while the file still accepts one', () => {
    query = { ...query, data: { pages: [{ items: [makeNominationFile({ auditionRequired: true })] }] } };
    renderSection();

    expect(screen.getByText('À programmer')).toBeInTheDocument();
  });

  it('announces no audition to schedule once the file no longer accepts one', () => {
    query = {
      ...query,
      data: {
        pages: [{ items: [makeNominationFile({ auditionRequired: true, canScheduleAudition: false })] }],
      },
    };
    renderSection();

    expect(screen.queryByText('À programmer')).not.toBeInTheDocument();
  });

  it('names without a link a session the user cannot open', () => {
    query = {
      ...query,
      data: {
        pages: [
          { items: [makeNominationFile({ session: { ...makeNominationFile().session, canOpen: false } })] },
        ],
      },
    };
    renderSection();

    expect(screen.getByText(/Transparence Annuelle/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('loads the next page once the last row is shown', () => {
    query = {
      ...query,
      data: { pages: [{ items: [makeNominationFile()] }] },
      hasNextPage: true,
    };
    renderSection();

    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it('does not ask for a next page when there is none', () => {
    query = { ...query, data: { pages: [{ items: [makeNominationFile()] }] }, hasNextPage: false };
    renderSection();

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
