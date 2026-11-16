import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { failureWith } from '@/test-utils/http-failure';

import { PresentationPlanLayout } from './PresentationPlanLayout';

type QueryState = { data: unknown; error: unknown; isPending: boolean };

const mocks = vi.hoisted(() => ({ plan: undefined as unknown as QueryState }));

vi.mock('@queries/agenda.queries', () => ({ useJusticePresentationPlanMetadataQuery: () => mocks.plan }));

function renderPresentationPlan() {
  const router = createMemoryRouter(
    [
      {
        children: [{ element: <h1>Notice du 12 mars</h1>, index: true }],
        element: <PresentationPlanLayout />,
        errorElement: <h1>Erreur inattendue</h1>,
        path: '/restitutions/:planId',
      },
    ],
    { initialEntries: ['/restitutions/plan-1'] },
  );

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <RouterProvider router={router} />
    </IntlProvider>,
  );
}

describe('PresentationPlanLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.plan = { data: { canEdit: true }, error: null, isPending: false };
  });

  it('lets the page load alongside the notice', () => {
    mocks.plan = { data: undefined, error: null, isPending: true };
    renderPresentationPlan();

    expect(screen.getByRole('heading', { name: 'Notice du 12 mars' })).toBeInTheDocument();
  });

  it('leads back to the notices to present when the notice no longer exists', () => {
    mocks.plan = { data: undefined, error: failureWith(404), isPending: false };
    renderPresentationPlan();

    expect(screen.getByRole('heading', { name: 'Notice de restitution introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Restitutions' })).toHaveAttribute(
      'href',
      '/secretariat-general/restitutions/a-restituer',
    );
    expect(screen.queryByRole('heading', { name: 'Notice du 12 mars' })).not.toBeInTheDocument();
  });

  it('shows the error page when the notice fails to load for another reason', () => {
    mocks.plan = { data: undefined, error: failureWith(500), isPending: false };
    renderPresentationPlan();

    expect(screen.getByRole('heading', { name: 'Erreur inattendue' })).toBeInTheDocument();
  });
});
