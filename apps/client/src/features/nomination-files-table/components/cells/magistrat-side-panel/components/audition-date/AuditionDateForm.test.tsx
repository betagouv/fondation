import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSidePanel, type SidePanelContextValue } from '../../context/side-panel.context';
import { SidePanelProvider } from '../../context/SidePanelProvider';
import { frFormat } from '@/i18n/formats';
import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';
import type { DetailedSummaryDto } from '@api/types';

import { AuditionDateForm } from './AuditionDateForm';

const mocks = vi.hoisted(() => ({
  waitForConfirmation: vi.fn(async () => ({ isConfirmed: true })),
}));

vi.mock('@/shared/context/confirm-modal', () => ({
  useConfirmModal: () => ({
    waitForConfirmation: mocks.waitForConfirmation,
  }),
}));

type AuditionResponse = Awaited<ReturnType<typeof $api.sessions.updateNominationFileAuditionDate>>;

function spyOnSave() {
  return vi
    .spyOn($api.sessions, 'updateNominationFileAuditionDate')
    .mockResolvedValue({} as AuditionResponse);
}

function renderAuditionDate(props: {
  editable: boolean;
  initialAuditionDate: DetailedSummaryDto['auditionDate'];
  initialAuditionTime: DetailedSummaryDto['auditionTime'];
}) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  const utils = render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <QueryClientProvider client={client}>
        <AuditionDateForm
          editable={props.editable}
          initialAuditionDate={props.initialAuditionDate}
          initialAuditionTime={props.initialAuditionTime}
          nominationFileId="nomination-file"
          sessionId="session-1"
        />
      </QueryClientProvider>
    </IntlProvider>,
  );

  return { ...utils, client };
}

function fillAuditionDate(date: string, time: string) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Heure'), { target: { value: time } });
}

afterEach(() => {
  vi.restoreAllMocks();
  mocks.waitForConfirmation.mockClear();
});

describe('AuditionDateForm read-only', () => {
  it('renders the scheduled date and time', () => {
    renderAuditionDate({
      editable: false,
      initialAuditionDate: { year: 2026, month: 9, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    expect(screen.getByText(/15\/09\/2026 à 14:30/)).toBeInTheDocument();
  });

  it('shows an empty state when no audition is scheduled', () => {
    renderAuditionDate({ editable: false, initialAuditionDate: null, initialAuditionTime: null });

    expect(screen.getByText("Aucune date et heure d'audition")).toBeInTheDocument();
  });
});

describe('AuditionDateForm edition', () => {
  it('saves the audition as a date-only and time-only pair', async () => {
    const update = spyOnSave();
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { sessionId: 'session-1', nominationFileId: 'nomination-file' },
          body: {
            auditionDate: { year: 2026, month: 9, day: 15 },
            auditionTime: { hours: 14, minutes: 30, seconds: 0 },
          },
        }),
      ),
    );
  });

  it.each([
    { field: 'Date', value: '2026-09-15', message: "L'heure est à renseigner" },
    { field: 'Heure', value: '14:30', message: 'La date est à renseigner' },
  ])('asks for the missing pair when only $field is filled', async ({ field, value, message }) => {
    const update = spyOnSave();
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText(field), { target: { value } });
    fireEvent.blur(screen.getByLabelText(field));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(update).not.toHaveBeenCalled();
  });

  it('clears the audition and confirms the reset under the fields', async () => {
    const update = spyOnSave();
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2026, month: 9, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ body: { auditionDate: null, auditionTime: null } }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent("Date d'audition réinitialisée");
  });

  it('locks the fields once the audition has occurred', () => {
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2020, month: 1, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    expect(screen.getByLabelText('Date')).toBeDisabled();
    expect(screen.getByLabelText('Heure')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier la date passée' })).toBeInTheDocument();
  });

  it('unlocks the fields and saves the corrected date after confirmation', async () => {
    const update = spyOnSave();
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2020, month: 1, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Modifier la date passée' }));

    expect(mocks.waitForConfirmation).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByLabelText('Date')).toBeEnabled());
    expect(screen.getByLabelText('Date')).toHaveValue('2020-01-15');

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2020-01-16' } });
    fireEvent.blur(screen.getByLabelText('Date'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            auditionDate: { year: 2020, month: 1, day: 16 },
            auditionTime: { hours: 14, minutes: 30, seconds: 0 },
          },
        }),
      ),
    );
  });

  it('keeps the fields locked when the edition is not confirmed', async () => {
    mocks.waitForConfirmation.mockResolvedValueOnce({ isConfirmed: false });
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2020, month: 1, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Modifier la date passée' }));

    expect(mocks.waitForConfirmation).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Date')).toBeDisabled();
    expect(screen.getByLabelText('Heure')).toBeDisabled();
  });

  it('confirms the save under the fields and hides it when editing again', async () => {
    spyOnSave();
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByRole('status')).toHaveTextContent("Date d'audition enregistrée");

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '15:00' } });

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('does not save again after a successful save of the same value', async () => {
    const update = spyOnSave();
    const { client } = renderAuditionDate({
      editable: true,
      initialAuditionDate: null,
      initialAuditionTime: null,
    });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.isMutating()).toBe(0));

    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(client.isMutating()).toBe(0);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('reports the failure and retries the same value after a rejected save', async () => {
    const update = vi
      .spyOn($api.sessions, 'updateNominationFileAuditionDate')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({} as AuditionResponse);
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByText("L'enregistrement de la date d'audition a échoué")).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
  });
});

describe('AuditionDateForm close guard', () => {
  function renderInPanel() {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const panelRef: { current: SidePanelContextValue | null } = { current: null };

    function Consumer() {
      panelRef.current = useSidePanel();
      return null;
    }

    render(
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <QueryClientProvider client={client}>
          <NuqsTestingAdapter hasMemory>
            <SidePanelProvider
              isFetching={false}
              nominationFiles={makeSessionNominationFileList(['a', 'b'])}
              onEndReached={vi.fn()}
              totalCount={2}
            >
              <Consumer />
              <AuditionDateForm
                editable
                initialAuditionDate={null}
                initialAuditionTime={null}
                nominationFileId="nomination-file"
                sessionId="session-1"
              />
            </SidePanelProvider>
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </IntlProvider>,
    );

    return { panel: () => panelRef.current! };
  }

  it('blocks closing while only the date is filled', () => {
    spyOnSave();
    const t = renderInPanel();
    act(() => t.panel().open('a'));

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-15' } });
    act(() => t.panel().close());

    expect(t.panel().activeId).toBe('a');
    expect(t.panel().isLeaveBlocked).toBe(true);
    expect(screen.getByText("L'heure est à renseigner")).toBeInTheDocument();
  });

  it.each([
    { state: 'both date and time are filled', fill: () => fillAuditionDate('2026-09-15', '14:30') },
    { state: 'both fields are left empty', fill: () => {} },
  ])('allows closing when $state', ({ fill }) => {
    spyOnSave();
    const t = renderInPanel();
    act(() => t.panel().open('a'));

    fill();
    act(() => t.panel().close());

    expect(t.panel().activeId).toBeNull();
    expect(t.panel().isLeaveBlocked).toBe(false);
  });
});
