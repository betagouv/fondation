import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import type { DetailedNominationSessionDto } from '@api/types';

import { SessionTabsBar } from './SessionTabs';

vi.mock('@queries/agenda.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useFindSessionDocsQuery: () => ({ data: { items: [{ id: 'doc-1' }, { id: 'doc-2' }] } }),
}));

vi.mock('@queries/nomination-sessions.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useListNominationSessionAttachmentsQuery: () => ({ data: { items: [{ id: 'file-1' }] } }),
  useNominationFilesStatusCountsQuery: () => ({ data: { missingEvaluation: 3, total: 12 } }),
}));

const TRANSPARENCE = {
  id: 'session-1',
  name: 'Transparence ABC',
  isArchivable: false,
  isArchived: false,
} as DetailedNominationSessionDto;

function renderBar(initialPath = '/secretariat-general/session/session-1') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={new QueryClient()}>
        <IntlProvider defaultLocale="fr" locale="fr">
          <ArchivedSessionContext value={{ isArchived: false, setIsArchived: vi.fn() }}>
            <SessionTabsBar transparence={TRANSPARENCE} />
          </ArchivedSessionContext>
        </IntlProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('SessionTabsBar', () => {
  it('should link every section of the transparence', () => {
    renderBar();

    expect(screen.getByRole('link', { name: 'Propositions 12' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1',
    );
    expect(screen.getByRole('link', { name: 'Évaluations manquantes 3' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1/evaluations-manquantes',
    );
    expect(screen.getByRole('link', { name: 'Documents 2' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1/documents',
    );
    expect(screen.getByRole('link', { name: 'Pièce jointe 1' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1/pieces-jointes',
    );
  });

  it('should mark the propositions as the current section on the session path', () => {
    renderBar();

    expect(screen.getByRole('link', { name: 'Propositions 12' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Documents 2' })).not.toHaveAttribute('aria-current');
  });

  it('should mark the attachments as the current section on their own path', () => {
    renderBar('/secretariat-general/session/session-1/pieces-jointes');

    expect(screen.getByRole('link', { name: 'Pièce jointe 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Propositions 12' })).not.toHaveAttribute('aria-current');
  });
});
