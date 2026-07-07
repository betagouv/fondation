import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { DetailedSummaryDto } from '@api/types';

import { SummaryAuditionDate } from './SummaryAuditionDate';

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
      <SummaryAuditionDate
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

describe('SummaryAuditionDate read-only', () => {
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

describe('SummaryAuditionDate edition', () => {
  it('saves the audition as a date-only and time-only pair', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).toHaveBeenCalledWith({
      auditionDate: { year: 2026, month: 9, day: 15 },
      auditionTime: { hours: 14, minutes: 30, seconds: 0 },
      nominationFileId: 'nomination-file',
      sessionId: 'session-1',
    });
  });

  it('asks for the time when only the date is filled', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-15' } });
    fireEvent.blur(screen.getByLabelText('Date'));

    expect(screen.getByRole('alert')).toHaveTextContent("L'heure est à renseigner");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('asks for the date when only the time is filled', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null, initialAuditionTime: null });

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '14:30' } });
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(screen.getByRole('alert')).toHaveTextContent('La date est à renseigner');
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

    expect(mutateAsync).toHaveBeenCalledTimes(2);
  });
});
