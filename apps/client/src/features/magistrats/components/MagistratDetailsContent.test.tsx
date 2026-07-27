import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { DetailedMagistratDto } from '@api/types';

import { MagistratDetailsContent } from './MagistratDetailsContent';
import type { MagistratNominationFile } from './MagistratNominationFilesTable';

vi.stubGlobal(
  'ResizeObserver',
  class {
    disconnect() {}
    observe() {}
    unobserve() {}
  },
);

type MagistratDetailsContentProps = ComponentProps<typeof MagistratDetailsContent>;
type PaginatedList<T> = {
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  items: T[];
  onLoadMore: () => void;
};

const magistrat: DetailedMagistratDto = {
  birthDate: { year: 1971, month: 3, day: 24 },
  careerHistory: null,
  civilite: 'Mme',
  currentPosition: null,
  externalUrl: 'https://lolfi.example.fr/magistrat/1',
  firstName: 'Honorine',
  grade: 'G3',
  gradeDate: null,
  id: 'magistrat-1',
  installationDate: null,
  lastName: 'Valrose',
  nominationDate: null,
  professionalEmail: null,
  usedName: null,
};

function makeNominationFile(overrides?: Partial<MagistratNominationFile>): MagistratNominationFile {
  return {
    auditionDate: null,
    auditionTime: null,
    id: 'dossier-1',
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

function emptyList<T>(overrides?: Partial<PaginatedList<T>>): PaginatedList<T> {
  return {
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    items: [],
    onLoadMore: vi.fn(),
    ...overrides,
  };
}

function renderContent(overrides?: Partial<MagistratDetailsContentProps>) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter>
        <MagistratDetailsContent
          context="sg"
          magistrat={magistrat}
          nominationFiles={emptyList()}
          observations={emptyList()}
          {...overrides}
        />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('MagistratDetailsContent', () => {
  it('shows the empty messages when there is nothing to list', () => {
    renderContent();

    expect(screen.getByText('Aucune proposition')).toBeInTheDocument();
    expect(screen.getByText('Aucune observation')).toBeInTheDocument();
    expect(screen.queryByText('Voir plus')).not.toBeInTheDocument();
  });

  it('shows a loading state while a list is fetching', () => {
    renderContent({ nominationFiles: emptyList({ isLoading: true }) });

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByText('Aucune proposition')).not.toBeInTheDocument();
  });

  it('loads the next page from the "Voir plus" button', async () => {
    const onLoadMore = vi.fn();
    renderContent({
      nominationFiles: emptyList({ hasMore: true, items: [makeNominationFile()], onLoadMore }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Voir plus' }));

    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
