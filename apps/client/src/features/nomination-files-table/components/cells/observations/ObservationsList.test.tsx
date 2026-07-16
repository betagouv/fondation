import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { ObservationsList } from './ObservationsList';

const mocks = vi.hoisted(() => ({
  useObservationsQuery: vi.fn(),
  onAdd: vi.fn(),
  onEdit: vi.fn(),
  onRequestDelete: vi.fn(),
}));

vi.mock('@queries/observations.queries', () => ({
  useObservationsQuery: mocks.useObservationsQuery,
  useGetObservationFileUrlMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderList() {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <ObservationsList
        nominationFileId="nomination-file-1"
        onAdd={mocks.onAdd}
        onEdit={mocks.onEdit}
        onRequestDelete={mocks.onRequestDelete}
        sessionId="session-1"
      />
    </IntlProvider>,
  );
}

describe('ObservationsList', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows the observations count as a heading', () => {
    mocks.useObservationsQuery.mockReturnValue({ data: { observations: [] }, isLoading: false });
    renderList();

    expect(screen.getByRole('heading', { name: 'Observations (0)' })).toBeVisible();
    expect(screen.getByText('Aucune observation pour ce dossier')).toBeVisible();
  });

  it('adds an observation from the title row button', async () => {
    mocks.useObservationsQuery.mockReturnValue({ data: { observations: [] }, isLoading: false });
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Ajouter une observation' }));

    expect(mocks.onAdd).toHaveBeenCalledTimes(1);
  });
});
