import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { AgendaMetadataForm } from './AgendaMetadataForm';

const PRESIDENT_ID = '0f8a3f3e-2d6b-4c1a-9f1e-6a7b8c9d0e11';

const mocks = vi.hoisted(() => ({ title: null as string | null }));

vi.mock('@queries/agenda.queries', () => ({
  useDocsMembersQuery: () => ({
    data: {
      items: [
        { duty: 'PRESIDENT', firstName: 'Anne', id: PRESIDENT_ID, lastName: 'Martin', title: mocks.title },
      ],
    },
    isFetching: false,
  }),
}));

function renderForm() {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <AgendaMetadataForm formation="SIEGE" onSubmit={vi.fn()} submitLabel="Continuer" />
    </IntlProvider>,
  );
  fireEvent.change(screen.getByLabelText(/Date de la séance de restitution/), {
    target: { value: '2026-12-01' },
  });
}

describe('AgendaMetadataForm', () => {
  it('lets the user continue once the meeting date is filled, the president of the formation being preselected', async () => {
    mocks.title = 'PRESIDENT_SIEGE';
    renderForm();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Continuer' })).toBeEnabled());
  });

  it('shows no chairman when no member holds the title of president of the formation', () => {
    mocks.title = null;
    renderForm();

    expect(screen.getByLabelText(/Président de séance/)).toHaveDisplayValue('Sélectionner un président');
  });
});
