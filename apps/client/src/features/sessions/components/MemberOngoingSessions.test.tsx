import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { getMySessionFilesPath } from '@/features/reports/hooks/useMyFilesFilter';
import { frFormat } from '@/i18n/formats';
import type { ListedMemberSession } from '@queries/members.queries';

import { MemberOngoingSessions } from './MemberOngoingSessions';

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'member' } }) }));

const REPORTED: ListedMemberSession = {
  date: { day: 20, month: 2, year: 2028 },
  fileCount: 3,
  formation: 'PARQUET',
  id: 'reported',
  isAffected: true,
  name: 'Transparence ABC',
  propositionCount: 120,
  reportCounts: { IN_PROGRESS: 1, NEW: 2, READY_TO_SUPPORT: 0, SUPPORTED: 0 },
};

const NOT_REPORTED: ListedMemberSession = {
  ...REPORTED,
  fileCount: 0,
  id: 'not-reported',
  isAffected: false,
  name: 'Transparence XYZ',
  reportCounts: { IN_PROGRESS: 0, NEW: 0, READY_TO_SUPPORT: 0, SUPPORTED: 0 },
};

function renderSessions(sessions: ListedMemberSession[]) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <MemberOngoingSessions sessions={sessions} />
      </IntlProvider>
    </MemoryRouter>,
  );
}

describe('MemberOngoingSessions', () => {
  it('shows the counters by state only on a session the member reports on', () => {
    renderSessions([REPORTED, NOT_REPORTED]);

    const [reported, notReported] = screen.getAllByRole('article');
    expect(within(reported!).getByRole('list', { name: 'Vos dossiers par état' })).toHaveTextContent(
      'Nouveau2En cours1Prêt à soutenir0Soutenu0',
    );
    expect(
      within(notReported!).queryByRole('list', { name: 'Vos dossiers par état' }),
    ).not.toBeInTheDocument();
    expect(notReported).toHaveTextContent('0 dossier sur 120 propositions');
  });

  it('only shows the sessions the member reports on once asked, and counts them', async () => {
    renderSessions([REPORTED, NOT_REPORTED]);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 sessions en cours');

    await userEvent.click(
      screen.getByRole('checkbox', { name: /uniquement les sessions où je suis rapporteur/ }),
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('1 session en cours');
    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => within(heading).getByRole('link').textContent),
    ).toEqual(['Transparence ABC']);
  });

  it('opens the session from its name', () => {
    renderSessions([REPORTED]);

    expect(screen.getByRole('link', { name: 'Transparence ABC' })).toHaveAttribute(
      'href',
      expect.stringContaining('/sessions/reported'),
    );
  });

  it('opens the session on the files of the member from "Vos dossiers"', () => {
    renderSessions([REPORTED]);

    expect(screen.getByRole('link', { name: 'Vos dossiers de la session Transparence ABC' })).toHaveAttribute(
      'href',
      getMySessionFilesPath({ sessionId: 'reported', userId: 'member' }),
    );
  });

  it('offers no toggle when no session is ongoing', () => {
    renderSessions([]);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('0 session en cours');
    expect(screen.getByText('Aucune session en cours')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('says so when the member reports on none of the ongoing sessions', async () => {
    renderSessions([NOT_REPORTED]);

    await userEvent.click(
      screen.getByRole('checkbox', { name: /uniquement les sessions où je suis rapporteur/ }),
    );

    expect(screen.getByText("Vous n'êtes rapporteur sur aucune session en cours")).toBeInTheDocument();
  });

  it('should pass basic accessibility', async () => {
    const { container } = renderSessions([REPORTED, NOT_REPORTED]);

    expect(await axe(container)).toHaveNoViolations();
  });
});
