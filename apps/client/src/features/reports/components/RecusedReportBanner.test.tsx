import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import type { FoundNominationFileMembersReportDto } from '@api/types';

import { RecusedReportBanner } from './RecusedReportBanner';

const BANNER = 'Vous vous êtes déporté(e) sur ce dossier';
const MY_REPORT = {
  id: 'report-1',
  state: 'NOT_APPLICABLE',
} satisfies FoundNominationFileMembersReportDto['report'];

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@queries/reports.queries', () => ({ useMyReportQuery: () => ({ data: MY_REPORT }) }));

function renderBanner(reportId: string) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RecusedReportBanner report={{ id: reportId, nominationFileId: 'dossier-1', sessionId: 'session-1' }} />
    </IntlProvider>,
  );
}

describe('RecusedReportBanner', () => {
  it('tells a recused reporter on their own report that they have nothing left to report on', () => {
    renderBanner(MY_REPORT.id);

    expect(screen.getByText(BANNER)).toBeVisible();
  });

  it("stays away from the co-reporter's report", () => {
    renderBanner('report-2');

    expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
  });
});
