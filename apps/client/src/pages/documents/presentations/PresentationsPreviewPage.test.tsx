import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { failureWith } from '@/test-utils/http-failure';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { PresentationPreviewPage } from './PresentationsPreviewPage';

vi.stubGlobal(
  'ResizeObserver',
  class {
    disconnect() {}
    observe() {}
    unobserve() {}
  },
);

const mocks = vi.hoisted(() => ({
  html: { data: undefined, error: null as unknown, isPending: true },
  metadata: { data: undefined as unknown, isFetching: false },
}));

vi.mock('@queries/agenda.queries', () => ({
  useJusticePresentationPlanHtmlQuery: () => mocks.html,
  useJusticePresentationPlanMetadataQuery: () => mocks.metadata,
  useValidatePresentationPlanMutation: () => ({ isError: false, isPending: false }),
}));

function renderPage(state?: { returnPath: string }) {
  const router = createMemoryRouter(
    [
      {
        element: <PresentationPreviewPage />,
        errorElement: <h1>Erreur inattendue</h1>,
        path: ROUTE_PATHS.SG.GDS.PRESENTATIONS_PREVIEW,
      },
    ],
    { initialEntries: [{ pathname: '/secretariat-general/gds/restitutions/plan-1/validation', state }] },
  );

  render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <RouterProvider router={router} />
    </IntlProvider>,
  );
}

describe('PresentationPreviewPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.html = { data: undefined, error: null, isPending: true };
    mocks.metadata = { data: undefined, isFetching: false };
  });

  it('should close back to the page the notice was opened from', () => {
    renderPage({ returnPath: '/secretariat-general/gds/session/session-1/documents' });

    expect(screen.getByRole('link', { name: 'Fermer' })).toHaveAttribute(
      'href',
      '/secretariat-general/gds/session/session-1/documents',
    );
  });

  it('should close back to the notices to present when opened directly', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Fermer' })).toHaveAttribute(
      'href',
      '/secretariat-general/gds/restitutions/a-restituer',
    );
  });

  it('should leave a notice deleted since it was last loaded to the layout', () => {
    mocks.html = { data: undefined, error: failureWith(404), isPending: false };
    mocks.metadata = { data: { canEdit: true, removedAgendas: [] }, isFetching: true };
    renderPage();

    expect(screen.queryByRole('heading', { name: 'Erreur inattendue' })).not.toBeInTheDocument();
  });

  it('should show the error page when the notice exists but its text fails to load', () => {
    mocks.html = { data: undefined, error: failureWith(500), isPending: false };
    mocks.metadata = { data: { canEdit: true, removedAgendas: [] }, isFetching: false };
    renderPage();

    expect(screen.getByRole('heading', { name: 'Erreur inattendue' })).toBeInTheDocument();
  });
});
