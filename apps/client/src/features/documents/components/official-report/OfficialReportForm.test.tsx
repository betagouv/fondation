import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { OfficialReportContext } from '@/features/documents/context/OfficialReportContext';
import type { FoundAgendasDto } from '@api/types';

import { OfficialReportForm } from './OfficialReportForm';

type PresentationPlan = FoundAgendasDto['items'][number]['presentationPlan'];

const mocks = vi.hoisted(() => ({
  agendas: { data: undefined as FoundAgendasDto | undefined, isFetchedAfterMount: false },
}));

vi.mock('@queries/agenda.queries', () => ({
  useListAgendasForNewOfficialReportQuery: () => mocks.agendas,
  useListSecretariesGeneralQuery: () => ({ data: { items: [] }, isFetching: false }),
}));
vi.mock('@/features/documents/components/AbsentMemberSelector', () => ({ AbsentMemberSelector: () => null }));
vi.mock('@/features/documents/components/ChairmanSelector', () => ({ ChairmanSelector: () => null }));
vi.mock('@/features/documents/components/JusticeContactSelector', () => ({
  JusticeContactSelector: () => null,
}));

function agendaList(presentationPlan: PresentationPlan): FoundAgendasDto {
  return {
    items: [
      {
        chairman: { firstName: 'Anne', id: 'chairman-1', lastName: 'Martin' },
        createdAt: '2026-03-01T09:00:00.000Z',
        createdBy: null,
        date: { day: 1, month: 3, year: 2026 },
        draftPresentationPlans: [],
        formation: 'PARQUET',
        id: 'agenda-1',
        officialReportId: null,
        presentationPlan,
        session: {
          comment: null,
          date: { day: 1, month: 2, year: 2026 },
          id: 'session-1',
          name: 'Transparence PR',
          typeDeSaisine: 'TRANSPARENCE_GDS',
        },
        sessionMeetingDate: { day: 12, month: 3, year: 2026 },
        validatedAt: '2026-03-02T09:00:00.000Z',
        validatedBy: null,
      },
    ],
  };
}

function OfficialReportFormTree() {
  return (
    <IntlProvider defaultLocale="fr" locale="fr">
      <MemoryRouter initialEntries={[{ pathname: '/', state: { agendaId: 'agenda-1' } }]}>
        <OfficialReportContext
          value={{
            cancel: vi.fn(),
            isSubmitting: false,
            officialReportId: null,
            report: null,
            session: { formation: 'PARQUET', id: 'session-1' },
            submit: vi.fn(),
          }}
        >
          <OfficialReportForm />
        </OfficialReportContext>
      </MemoryRouter>
    </IntlProvider>
  );
}

describe('OfficialReportForm', () => {
  it('should fill the times of the restitution when the agenda list in cache predates it', async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: false };
    const { rerender } = render(<OfficialReportFormTree />);
    expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toHaveValue('');

    mocks.agendas = {
      data: agendaList({
        absentMembers: [],
        endTime: { hours: 12, minutes: 15, seconds: 0 },
        hasRenunciation: true,
        id: 'plan-1',
        justiceContactId: 'contact-1',
        secretaryId: 'secretary-1',
        startTime: { hours: 10, minutes: 30, seconds: 0 },
      }),
      isFetchedAfterMount: true,
    };
    rerender(<OfficialReportFormTree />);

    expect(await screen.findByDisplayValue('10:30')).toHaveAccessibleName(/Heure de début de la séance/);
    expect(screen.getByLabelText(/Heure de fin de la séance/)).toHaveValue('12:15');
  });
});
