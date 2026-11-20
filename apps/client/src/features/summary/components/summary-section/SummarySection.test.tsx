import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { authKeys } from '@queries/auth.queries';

import { SummarySection } from './SummarySection';

describe('SummarySection', () => {
  it('shows the admin impersonating a reader that the summary is private', () => {
    const client = new QueryClient();
    client.setQueryData(authKeys.introspectSession(), { id: 'member-1', role: 'MEMBRE_COMMUN' });

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <QueryClientProvider client={client}>
          <ArchivedSessionContext value={{ isArchived: false, setIsArchived: vi.fn() }}>
            <SummarySection
              canRead={false}
              hasSummary
              nominationFileId="file-1"
              sessionId="session-1"
              visibility="PRIVATE"
            />
          </ArchivedSessionContext>
        </QueryClientProvider>
      </IntlProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Synthèse' })).toBeInTheDocument();
    expect(screen.getByText('Contenu privé')).toBeInTheDocument();
  });
});
