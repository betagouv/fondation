import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMagistratPanel, type MagistratPanelContextValue } from '../../context/magistrat-panel.context';
import { MagistratPanelProvider } from '../../context/MagistratPanelProvider';
import { frFormat } from '@/i18n/formats';
import { makeSessionNominationFileList } from '@/test-utils/factories/session-nomination-file.factory';
import * as $api from '@api/sdk';
import type { DetailedSummaryDto } from '@api/types';

import { MagistratAuditionDateForm } from './MagistratAuditionDateForm';

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
        <MagistratAuditionDateForm
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

afterEach(() => vi.restoreAllMocks());

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

  it('asks for the time when only the date is filled', async () => {
    const update = spyOnSave();
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-15' } });
    fireEvent.blur(screen.getByLabelText('Date'));

    expect(await screen.findByRole('alert')).toHaveTextContent("L'heure est à renseigner");
    expect(update).not.toHaveBeenCalled();
  });

  it('asks for the date when only the time is filled', async () => {
    const update = spyOnSave();
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '14:30' } });
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByRole('alert')).toHaveTextContent('La date est à renseigner');
    expect(update).not.toHaveBeenCalled();
  });

  it('clears the audition when reset', async () => {
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
  });

  it('disables the fields and hides the reset button once the audition has occurred', () => {
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2020, month: 1, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    expect(screen.getByLabelText('Date')).toBeDisabled();
    expect(screen.getByLabelText('Heure')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Réinitialiser' })).not.toBeInTheDocument();
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

  it('clears the failure message as soon as a field is edited again', async () => {
    vi.spyOn($api.sessions, 'updateNominationFileAuditionDate').mockRejectedValueOnce(new Error('network'));
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByText("L'enregistrement de la date d'audition a échoué")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '15:00' } });

    await waitFor(() =>
      expect(screen.queryByText("L'enregistrement de la date d'audition a échoué")).not.toBeInTheDocument(),
    );
  });
});

describe('AuditionDateForm close guard', () => {
  function renderInPanel() {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const panelRef: { current: MagistratPanelContextValue | null } = { current: null };

    function Consumer() {
      panelRef.current = useMagistratPanel();
      return null;
    }

    render(
      <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
        <QueryClientProvider client={client}>
          <MagistratPanelProvider
            isFetching={false}
            nominationFiles={makeSessionNominationFileList(['a', 'b'])}
            onPageChange={vi.fn()}
            pagination={{ pageIndex: 0, pageSize: 2 }}
            totalCount={2}
          >
            <Consumer />
            <MagistratAuditionDateForm
              editable
              initialAuditionDate={null}
              initialAuditionTime={null}
              nominationFileId="nomination-file"
              sessionId="session-1"
            />
          </MagistratPanelProvider>
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

  it('allows closing once both date and time are filled', () => {
    spyOnSave();
    const t = renderInPanel();
    act(() => t.panel().open('a'));

    fillAuditionDate('2026-09-15', '14:30');
    act(() => t.panel().close());

    expect(t.panel().activeId).toBeNull();
    expect(t.panel().isLeaveBlocked).toBe(false);
  });

  it('allows closing when both fields are left empty', () => {
    spyOnSave();
    const t = renderInPanel();
    act(() => t.panel().open('a'));

    act(() => t.panel().close());

    expect(t.panel().activeId).toBeNull();
    expect(t.panel().isLeaveBlocked).toBe(false);
  });
});
