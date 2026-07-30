import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    auditionTime: null,
    id: 'dossier-1',
    name: 'VALROSE Honorine',
    number: 12,
    outcome: null,
    reporters: [],
    session: {
      id: 'session-1',
      name: 'Transparence Annuelle 2026',
      formation: 'SIEGE',
      date: { year: 2026, month: 2, day: 20 },
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

  it('loads the next page from the "Voir plus" button', async () => {
    query = {
      ...query,
      data: { pages: [{ items: [makeNominationFile()] }] },
      hasNextPage: true,
    };
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    expect(fetchNextPage).toHaveBeenCalledOnce();
  });
});
