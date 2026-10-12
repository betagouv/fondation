import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import type { DetailedNominationSessionDto } from '@api/types';

import { TransparenceActions } from './TransparenceActions';

vi.mock('@queries/nomination-sessions.queries', () => ({
  useArchiveNominationSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNominationSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn(), success: vi.fn() }) }));

const NEW_SESSION: DetailedNominationSessionDto = {
  date: { year: 2028, month: 3, day: 12 },
  dueDate: null,
  formation: 'SIEGE',
  id: 'session-1',
  isArchivable: false,
  isArchived: false,
  isDeletable: true,
  isValidated: false,
  name: 'Transparence du 12 mars 2028',
  observationsClosingDate: { year: 2028, month: 2, day: 1 },
  outcomes: [],
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
};

function renderActions(transparence: DetailedNominationSessionDto) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ConfirmModalProvider>
          <TransparenceActions transparence={transparence} />
        </ConfirmModalProvider>
      </IntlProvider>
    </MemoryRouter>,
  );
}

const archiveButton = () => screen.queryByRole('button', { name: 'Archiver' });
const deleteButton = () => screen.queryByRole('button', { name: 'Supprimer' });

describe('TransparenceActions', () => {
  it('offers the deletion while the session data is not validated yet', () => {
    renderActions(NEW_SESSION);

    expect(deleteButton()).toBeInTheDocument();
    expect(archiveButton()).not.toBeInTheDocument();
  });

  it('withdraws the deletion once the session data is validated', () => {
    renderActions({ ...NEW_SESSION, isValidated: true });

    expect(deleteButton()).not.toBeInTheDocument();
  });

  it('withdraws the deletion the API refuses', () => {
    renderActions({ ...NEW_SESSION, isDeletable: false });

    expect(deleteButton()).not.toBeInTheDocument();
  });

  it('offers the archiving once every report is returned', () => {
    renderActions({ ...NEW_SESSION, isArchivable: true, isValidated: true });

    expect(archiveButton()).toBeInTheDocument();
    expect(deleteButton()).not.toBeInTheDocument();
  });
});
