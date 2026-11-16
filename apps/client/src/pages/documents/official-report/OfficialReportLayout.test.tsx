import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { OfficialReportLayout } from './OfficialReportLayout';

type QueryState = { data: unknown; error: unknown; isPending: boolean };

const mocks = vi.hoisted(() => ({
  officialReport: undefined as unknown as QueryState,
  session: undefined as unknown as QueryState,
}));

vi.mock('@queries/agenda.queries', () => ({ useDetailsOfficialReportQuery: () => mocks.officialReport }));
vi.mock('@queries/nomination-sessions.queries', () => ({
  useDetailedNominationSessionQuery: () => mocks.session,
}));

function failureWith(status: number): unknown {
  try {
    httpAssert(new Response(null, { status }));
  } catch (exception) {
    return exception;
  }
}

function renderOfficialReport() {
  const router = createMemoryRouter(
    [
      {
        children: [{ element: <h1>Procès-verbal du 12 mars</h1>, index: true }],
        element: <OfficialReportLayout />,
        errorElement: <h1>Erreur inattendue</h1>,
        path: '/sessions/:sessionId/pv/:officialReportId',
      },
    ],
    { initialEntries: ['/sessions/session-1/pv/report-1'] },
  );

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RouterProvider router={router} />
    </IntlProvider>,
  );
}

describe('OfficialReportLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.session = { data: { id: 'session-1' }, error: null, isPending: false };
    mocks.officialReport = { data: { id: 'report-1' }, error: null, isPending: false };
  });

  it('lets the page load alongside the session and the official report', () => {
    mocks.session = { data: undefined, error: null, isPending: true };
    mocks.officialReport = { data: undefined, error: null, isPending: true };
    renderOfficialReport();

    expect(screen.getByRole('heading', { name: 'Procès-verbal du 12 mars' })).toBeInTheDocument();
  });

  it('tells the secretariat that the session no longer exists', () => {
    mocks.session = { data: undefined, error: failureWith(404), isPending: false };
    mocks.officialReport = { data: undefined, error: failureWith(404), isPending: false };
    renderOfficialReport();

    expect(screen.getByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Page d'accueil" })).toHaveAttribute(
      'href',
      '/secretariat-general',
    );
  });

  it('leads back to the documents of the session when the official report no longer exists', () => {
    mocks.officialReport = { data: undefined, error: failureWith(404), isPending: false };
    renderOfficialReport();

    expect(screen.getByRole('heading', { name: 'Procès-verbal introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Documents de la session' })).toHaveAttribute(
      'href',
      '/secretariat-general/session/session-1/documents',
    );
    expect(screen.queryByRole('heading', { name: 'Procès-verbal du 12 mars' })).not.toBeInTheDocument();
  });

  it('waits for the session before saying that only the official report is missing', () => {
    mocks.session = { data: undefined, error: null, isPending: true };
    mocks.officialReport = { data: undefined, error: failureWith(404), isPending: false };
    renderOfficialReport();

    expect(screen.queryByRole('heading', { name: 'Procès-verbal introuvable' })).not.toBeInTheDocument();
  });

  it('shows the error page when the official report fails to load for another reason', () => {
    mocks.officialReport = { data: undefined, error: failureWith(500), isPending: false };
    renderOfficialReport();

    expect(screen.getByRole('heading', { name: 'Erreur inattendue' })).toBeInTheDocument();
  });
});
