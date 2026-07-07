import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SummaryAuditionDate } from './SummaryAuditionDate';

const mutateAsync = vi.fn<(input: { auditionDate: string | null }) => Promise<void>>();
vi.mock('@queries/members.queries', () => ({
  useUpdateNominationFileAuditionDateMutation: () => ({ mutateAsync }),
}));

function renderAuditionDate(props: { editable: boolean; initialAuditionDate: string | null }) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SummaryAuditionDate
        editable={props.editable}
        initialAuditionDate={props.initialAuditionDate}
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
    const iso = new Date('2026-09-15T14:30').toISOString();
    renderAuditionDate({ editable: false, initialAuditionDate: iso });

    expect(screen.getByText('15/09/2026 à 14h30')).toBeInTheDocument();
  });

  it('shows an empty state when no audition is scheduled', () => {
    renderAuditionDate({ editable: false, initialAuditionDate: null });

    expect(screen.getByText("Aucune date et heure d'audition")).toBeInTheDocument();
  });
});

describe('SummaryAuditionDate edition', () => {
  it('saves the audition as an ISO string built from date and time', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).toHaveBeenCalledWith({
      auditionDate: new Date('2026-09-15T14:30').toISOString(),
      nominationFileId: 'nomination-file',
      sessionId: 'session-1',
    });
  });

  it('asks for the time when only the date is filled', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-15' } });
    fireEvent.blur(screen.getByLabelText('Date'));

    expect(screen.getByRole('alert')).toHaveTextContent("L'heure est à renseigner");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('asks for the date when only the time is filled', () => {
    renderAuditionDate({ editable: true, initialAuditionDate: null });

    fireEvent.change(screen.getByLabelText('Heure'), { target: { value: '14:30' } });
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(screen.getByRole('alert')).toHaveTextContent('La date est à renseigner');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('clears the audition when reset', async () => {
    const iso = new Date('2026-09-15T14:30').toISOString();
    renderAuditionDate({ editable: true, initialAuditionDate: iso });

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ auditionDate: null }));
  });

  it('does not save again when the value is unchanged', () => {
    const iso = new Date('2026-09-15T14:30').toISOString();
    renderAuditionDate({ editable: true, initialAuditionDate: iso });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('reports the failure and retries the same value after a rejected save', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('network'));
    renderAuditionDate({ editable: true, initialAuditionDate: null });

    fillAuditionDate('2026-09-15', '14:30');
    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(await screen.findByText("L'enregistrement de la date d'audition a échoué")).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText('Heure'));

    expect(mutateAsync).toHaveBeenCalledTimes(2);
  });
});
