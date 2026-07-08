import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { DetailedSummaryDto } from '@api/types';

import { AuditionDateForm } from './SummarySectionAuditionDate';

const mutateAsync =
  vi.fn<
    (input: {
      auditionDate: DetailedSummaryDto['auditionDate'];
      auditionTime: DetailedSummaryDto['auditionTime'];
    }) => Promise<void>
  >();
vi.mock('@queries/members.queries', () => ({
  useUpdateNominationFileAuditionDateMutation: () => ({ mutateAsync }),
}));

function renderAuditionDate(props: {
  editable: boolean;
  initialAuditionDate: DetailedSummaryDto['auditionDate'];
  initialAuditionTime: DetailedSummaryDto['auditionTime'];
}) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <AuditionDateForm
        editable={props.editable}
        initialAuditionDate={props.initialAuditionDate}
        initialAuditionTime={props.initialAuditionTime}
        nominationFileId="nomination-file"
        sessionId="session-1"
      />
    </IntlProvider>,
  );
}

function fillAuditionDate(date: string, time: string) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Heure'), { target: { value: time } });
}

beforeEach(() => {
  mutateAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuditionDateForm read-only', () => {
  it('renders the scheduled date and time', () => {
    renderAuditionDate({
      editable: false,
      initialAuditionDate: { year: 2026, month: 9, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    expect(screen.getByText('15/09/2026 à 14:30')).toBeInTheDocument();
  });

  it('shows an empty state when no audition is scheduled', () => {
    renderAuditionDate({ editable: false, initialAuditionDate: null, initialAuditionTime: null });

    expect(screen.getByText("Aucune date et heure d'audition")).toBeInTheDocument();
  });
});

describe('AuditionDateForm edition', () => {
  it('saves the audition as a date-only and time-only pair', async () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        auditionDate: { year: 2026, month: 9, day: 15 },
        auditionTime: { hours: 14, minutes: 30, seconds: 0 },
        nominationFileId: 'nomination-file',
        sessionId: 'session-1',
      }),
    );
  });

  it('asks for the time when only the date is filled', async () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-15' } });
    fireEvent.blur(screen.getByLabelText('Date'));

    expect(await screen.findByRole('alert')).toHaveTextContent("L'heure est à renseigner");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('asks for the date when only the time is filled', async () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '14:30' } });
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByRole('alert')).toHaveTextContent('La date est à renseigner');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('clears the audition when reset', async () => {
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2026, month: 9, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ auditionDate: null, auditionTime: null }),
    );
  });

  it('does not save again after a successful save of the same value', async () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));

    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it('does not save again when the value is unchanged', () => {
    renderAuditionDate({
      editable: true,
      initialAuditionDate: { year: 2026, month: 9, day: 15 },
      initialAuditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('reports the failure and retries the same value after a rejected save', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('network'));
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByText("L'enregistrement de la date d'audition a échoué")).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText('Heure'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
  });
});
