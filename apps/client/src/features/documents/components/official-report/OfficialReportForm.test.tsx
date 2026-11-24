import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { OfficialReportContext } from '@/features/documents/context/OfficialReportContext';
import type { OfficialReportContextType } from '@/features/documents/context/OfficialReportContext.types';
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

const EXISTING_REPORT: OfficialReportContextType['report'] = {
  agendaId: 'agenda-1',
  chairmanId: '0f8a3f3e-2d6b-4c1a-9f1e-6a7b8c9d0e11',
  hasRenunciation: true,
  justiceContactId: '12',
  memberIds: [],
  secretaryId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  sessionMeetingDate: { day: 12, month: 3, year: 2026 },
  sessionMeetingEndingTime: { hours: 12, minutes: 15, seconds: 0 },
  sessionMeetingStartingTime: { hours: 10, minutes: 30, seconds: 0 },
};

function OfficialReportFormTree(
  props: Pick<
    Partial<OfficialReportContextType>,
    'changedSinceValidation' | 'officialReportId' | 'report'
  > & { requestedAgendaId?: string | null } = {},
) {
  const { requestedAgendaId = 'agenda-1' } = props;
  return (
    <IntlProvider defaultLocale="fr" locale="fr">
      <MemoryRouter
        initialEntries={[
          { pathname: '/', state: requestedAgendaId ? { agendaId: requestedAgendaId } : null },
        ]}
      >
        <OfficialReportContext
          value={{
            cancel: vi.fn(),
            changedSinceValidation: props.changedSinceValidation ?? [],
            isSubmitting: false,
            officialReportId: props.officialReportId ?? null,
            recordedMemberIds: [],
            report: props.report ?? null,
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
  it('should fill the date and times of the restitution when the agenda list in cache predates it', async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: false };
    const { rerender } = render(<OfficialReportFormTree />);
    expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toHaveValue('');

    mocks.agendas = {
      data: agendaList({
        absentMembers: [],
        date: { day: 13, month: 3, year: 2026 },
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
    expect(screen.getByLabelText(/Date de la séance/)).toHaveValue('2026-03-13');
  });

  it("should keep the agenda chosen from the documentation table's button", async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    render(<OfficialReportFormTree />);

    const agenda = screen.getByRole('combobox', { name: /Ordre du jour/ });
    await waitFor(() => expect(agenda).toHaveValue('agenda-1'));
    expect(agenda).toBeDisabled();
    expect(agenda).toHaveAccessibleName(/Choisi depuis le tableau de la documentation/);
  });

  it('should not claim a choice while the agenda list is still the cached one', () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: false };
    render(<OfficialReportFormTree />);

    const agenda = screen.getByRole('combobox', { name: /Ordre du jour/ });
    expect(agenda).toBeDisabled();
    expect(agenda).not.toHaveAccessibleName(/Choisi depuis le tableau/);
  });

  it('should let the agenda be chosen when the fresh list no longer offers the requested one', () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    render(<OfficialReportFormTree requestedAgendaId="agenda-with-a-report" />);

    expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toBeEnabled();
  });

  it('should ask for another agenda when the refreshed list no longer offers the chosen one', async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    const { rerender } = render(<OfficialReportFormTree />);
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toHaveValue('agenda-1'),
    );

    mocks.agendas = {
      data: { items: agendaList(null).items.map((agenda) => ({ ...agenda, id: 'agenda-2' })) },
      isFetchedAfterMount: true,
    };
    rerender(<OfficialReportFormTree />);

    expect(await screen.findByText('Veuillez sélectionner un ordre du jour')).toBeVisible();
    expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toBeEnabled();
  });

  it('should let the agenda be chosen when the form opens from the menu', () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    render(<OfficialReportFormTree requestedAgendaId={null} />);

    expect(screen.getByRole('combobox', { name: /Ordre du jour/ })).toBeEnabled();
  });

  it('should not offer to update a report until a field moves', async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    render(<OfficialReportFormTree officialReportId="report-1" report={EXISTING_REPORT} />);

    const update = screen.getByRole('button', { name: 'Mettre à jour' });
    expect(update).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox', { name: /Renonciation du ministère/ }));
    expect(update).toBeEnabled();
  });

  it('should let a report that fell behind its agenda be saved as it is', async () => {
    mocks.agendas = { data: agendaList(null), isFetchedAfterMount: true };
    render(
      <OfficialReportFormTree
        changedSinceValidation={['AGENDA_PROPOSITIONS']}
        officialReportId="report-1"
        report={EXISTING_REPORT}
      />,
    );

    // the resolver validates the loaded values asynchronously, the button opens once it is done
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeEnabled());
  });
});
