import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { failureWith } from '@/test-utils/http-failure';

import { AgendaLayout } from './AgendaLayout';

type QueryState = { data: unknown; error: unknown; isPending: boolean };

const mocks = vi.hoisted(() => ({
  agenda: undefined as unknown as QueryState,
  session: undefined as unknown as QueryState,
}));

vi.mock('@queries/agenda.queries', () => ({ useDetailsAgendaMetadataQuery: () => mocks.agenda }));
vi.mock('@queries/nomination-sessions.queries', () => ({
  useDetailedNominationSessionQuery: () => mocks.session,
}));

function renderAgenda() {
  const router = createMemoryRouter(
    [
      {
        children: [{ element: <h1>Ordre du jour du 12 mars</h1>, index: true }],
        element: <AgendaLayout />,
        errorElement: <h1>Erreur inattendue</h1>,
        path: '/sessions/:sessionId/ordre-du-jour/:agendaId',
      },
    ],
    { initialEntries: ['/sessions/session-1/ordre-du-jour/agenda-1'] },
  );

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RouterProvider router={router} />
    </IntlProvider>,
  );
}

describe('AgendaLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.session = { data: { id: 'session-1' }, error: null, isPending: false };
    mocks.agenda = { data: { session: { id: 'session-1' }, status: 'DRAFT' }, error: null, isPending: false };
  });

  it('lets the page load alongside the session and the agenda', () => {
    mocks.session = { data: undefined, error: null, isPending: true };
    mocks.agenda = { data: undefined, error: null, isPending: true };
    renderAgenda();

    expect(screen.getByRole('heading', { name: 'Ordre du jour du 12 mars' })).toBeInTheDocument();
  });

  it('tells the secretariat that the session no longer exists', () => {
    mocks.session = { data: undefined, error: failureWith(404), isPending: false };
    mocks.agenda = { data: undefined, error: failureWith(404), isPending: false };
    renderAgenda();

    expect(screen.getByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Page d'accueil" })).toHaveAttribute(
      'href',
      '/secretariat-general',
    );
  });

  it('leads back to the documents of the session when the agenda no longer exists', () => {
    mocks.agenda = { data: undefined, error: failureWith(404), isPending: false };
    renderAgenda();

    expect(screen.getByRole('heading', { name: 'Ordre du jour introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Documents de la session' })).toHaveAttribute(
      'href',
      '/secretariat-general/gds/session/session-1/documents',
    );
    expect(screen.queryByRole('heading', { name: 'Ordre du jour du 12 mars' })).not.toBeInTheDocument();
  });

  it('says that an agenda of another session is missing', () => {
    mocks.agenda = { data: { session: { id: 'session-2' }, status: 'DRAFT' }, error: null, isPending: false };
    renderAgenda();

    expect(screen.getByRole('heading', { name: 'Ordre du jour introuvable' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ordre du jour du 12 mars' })).not.toBeInTheDocument();
  });

  it('waits for the session before saying that only the agenda is missing', () => {
    mocks.session = { data: undefined, error: null, isPending: true };
    mocks.agenda = { data: undefined, error: failureWith(404), isPending: false };
    renderAgenda();

    expect(screen.queryByRole('heading', { name: 'Ordre du jour introuvable' })).not.toBeInTheDocument();
  });

  it('shows the error page when the agenda fails to load for another reason', () => {
    mocks.agenda = { data: undefined, error: failureWith(500), isPending: false };
    renderAgenda();

    expect(screen.getByRole('heading', { name: 'Erreur inattendue' })).toBeInTheDocument();
  });
});
