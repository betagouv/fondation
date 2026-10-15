import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
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

vi.mock('@queries/agenda.queries', () => ({
  useJusticePresentationPlanHtmlQuery: () => ({ data: undefined, isPending: true }),
  useJusticePresentationPlanMetadataQuery: () => ({ data: undefined }),
  useValidatePresentationPlanMutation: () => ({ isError: false, isPending: false }),
}));

function page(state?: { returnPath: string }) {
  return (
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <MemoryRouter
        initialEntries={[{ pathname: '/secretariat-general/restitutions/plan-1/validation', state }]}
      >
        <Routes>
          <Route element={<PresentationPreviewPage />} path={ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW} />
        </Routes>
      </MemoryRouter>
    </IntlProvider>
  );
}

describe('PresentationPreviewPage', () => {
  it('should close back to the page the notice was opened from', () => {
    render(page({ returnPath: '/secretariat-general/sessions/session-1/documents' }));

    expect(screen.getByRole('link', { name: 'Fermer' })).toHaveAttribute(
      'href',
      '/secretariat-general/sessions/session-1/documents',
    );
  });

  it('should close back to the notices to present when opened directly', () => {
    render(page());

    expect(screen.getByRole('link', { name: 'Fermer' })).toHaveAttribute(
      'href',
      '/secretariat-general/restitutions/a-restituer',
    );
  });
});
