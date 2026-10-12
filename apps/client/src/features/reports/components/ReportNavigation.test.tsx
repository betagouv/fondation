import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { getGdsReportPath } from '@/utils/route-path.utils';
import type { ListedMemberSessionReportsDto } from '@api/types';

import { ReportNavigation } from './ReportNavigation';

let items: ListedMemberSessionReportsDto['items'];

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@queries/members.queries', () => ({
  useListMemberSessionReports: () => ({ data: { items } }),
}));

function makeReport(
  overrides: Partial<ListedMemberSessionReportsDto['items'][number]>,
): ListedMemberSessionReportsDto['items'][number] {
  return {
    name: 'KOFFI Aminata',
    nominationFileId: 'dossier-1',
    number: 1,
    report: { id: 'report-1', state: 'IN_PROGRESS' },
    ...overrides,
  };
}

function renderNavigation(reportId: string) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter>
        <ReportNavigation reportId={reportId} sessionId="session-1" />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('ReportNavigation', () => {
  beforeEach(() => {
    items = [
      makeReport({}),
      makeReport({
        name: 'AUBRY Gaspard',
        nominationFileId: 'dossier-3',
        number: 3,
        report: { id: 'report-2', state: 'IN_PROGRESS' },
      }),
      makeReport({
        name: 'BENALI Sofia',
        nominationFileId: 'dossier-4',
        number: 4,
        report: { id: 'report-3', state: 'SUPPORTED' },
      }),
    ];
  });

  it('links to the surrounding reports of the session', () => {
    renderNavigation('report-2');

    expect(screen.getByRole('link', { name: 'Précédent : n°1 - KOFFI Aminata' })).toHaveAttribute(
      'href',
      getGdsReportPath('report-1'),
    );
    expect(screen.getByRole('link', { name: 'Suivant : n°4 - BENALI Sofia' })).toHaveAttribute(
      'href',
      getGdsReportPath('report-3'),
    );
  });

  it('offers no previous report on the first one', () => {
    renderNavigation('report-1');

    expect(screen.queryByRole('link', { name: /Précédent/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suivant : n°3 - AUBRY Gaspard' })).toBeInTheDocument();
  });

  it('offers no next report on the last one', () => {
    renderNavigation('report-3');

    expect(screen.getByRole('link', { name: 'Précédent : n°3 - AUBRY Gaspard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Suivant/ })).not.toBeInTheDocument();
  });

  it('names a report without a file number by the magistrat alone', () => {
    items = [
      items[0],
      makeReport({ name: 'PEREIRA Lucas', number: null, report: { id: 'report-9', state: 'NEW' } }),
    ];
    renderNavigation('report-1');

    expect(screen.getByRole('link', { name: 'Suivant : PEREIRA Lucas' })).toBeInTheDocument();
  });

  it('shows nothing when the member has this single report', () => {
    items = [items[0]];
    const { container } = renderNavigation('report-1');

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when the member has no report in this session', () => {
    items = [];
    const { container } = renderNavigation('report-1');

    expect(container).toBeEmptyDOMElement();
  });
});
