import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { PresentationAgendaCommentsStep } from '@/features/documents/components/presentations/PresentationAgendaCommentsStep';

import { PresentationPlanProvider } from './PresentationPlanProvider';

const mocks = vi.hoisted(() => ({
  // the provider copies the metadata into its state whenever they change: a new object each render would loop
  metadata: {
    absentMemberIds: [],
    agendas: [{ comment: '', id: 'agenda-1' }],
    chairmanId: 'chairman-1',
    date: { day: 10, month: 2, year: 2026 },
    formation: 'SIEGE',
    hasRenunciation: true,
    isManuallyEdited: false,
    justiceDepartmentContactId: '12',
    outdated: false,
    secretaryId: 'secretary-1',
    status: 'DRAFT' as 'DRAFT' | 'VALIDATED',
    time: { hours: 9, minutes: 30 },
  },
  mutation: () => ({ error: null, isPending: false, mutate: () => {}, reset: () => {} }),
}));

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({ waitForConfirmation: vi.fn() }),
}));

vi.mock('@queries/agenda.queries', () => ({
  presentationPlanKeys: { planHtml: vi.fn() },
  useCreateJusticePresentationPlanMutation: mocks.mutation,
  useJusticePresentationPlanMetadataQuery: () => ({ data: mocks.metadata, isFetching: false }),
  useListPresentationPlansAgendasQuery: () => ({
    data: { items: [{ id: 'agenda-1', session: { comment: null, id: 'session-1', name: 'T1' } }] },
  }),
  useUpdateJusticePresentationPlanMutation: mocks.mutation,
}));

function renderSavedNotice(props: { isManuallyEdited?: boolean; status: 'DRAFT' | 'VALIDATED' }) {
  mocks.metadata.isManuallyEdited = props.isManuallyEdited ?? false;
  mocks.metadata.status = props.status;
  const router = createMemoryRouter(
    [
      {
        element: (
          <PresentationPlanProvider>
            <PresentationAgendaCommentsStep />
          </PresentationPlanProvider>
        ),
        path: '/restitutions/:planId',
      },
    ],
    { initialEntries: ['/restitutions/plan-1'] },
  );

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlProvider defaultLocale="fr" locale="fr">
        <RouterProvider router={router} />
      </IntlProvider>
    </QueryClientProvider>,
  );
}

describe('PresentationPlanProvider', () => {
  it('should let a new notice be saved right after its meeting information, sessions without comment', () => {
    renderSavedNotice({ status: 'DRAFT' });

    expect(screen.getByRole('button', { name: 'Enregistrer la notice' })).toBeEnabled();
  });

  it('should not offer to save a validated notice as it already is', () => {
    renderSavedNotice({ status: 'VALIDATED' });

    expect(screen.getByRole('button', { name: 'Enregistrer la notice' })).toBeDisabled();
  });

  it('should not offer to save a manually edited draft as it already is, which would announce losing its edits', () => {
    renderSavedNotice({ isManuallyEdited: true, status: 'DRAFT' });

    expect(screen.getByRole('button', { name: 'Enregistrer la notice' })).toBeDisabled();
  });
});
