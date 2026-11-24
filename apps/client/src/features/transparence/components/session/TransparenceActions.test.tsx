import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { generatePath, MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';

import { TransparenceActions } from './TransparenceActions';

const { successToast } = vi.hoisted(() => ({ successToast: vi.fn() }));

vi.mock('@queries/nomination-sessions.queries', () => ({
  useArchiveNominationSessionMutation: () => ({
    isPending: false,
    mutate: (_: undefined, options: { onSuccess: () => void }) => options.onSuccess(),
  }),
  useDeleteNominationSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn(), success: successToast }) }));

const SESSION_PATH = generatePath(ROUTE_PATHS.SG.GDS.SESSION_ID, { sessionId: 'session-1' });

function CurrentPath() {
  return <p>{useLocation().pathname}</p>;
}

const NEW_SESSION: DetailedNominationSessionDto = {
  date: { year: 2028, month: 3, day: 12 },
  dueDate: null,
  formation: 'SIEGE',
  id: 'session-1',
  isArchivable: false,
  isArchived: false,
  isDeletable: true,
  isValidated: false,
  label: 'T 12/03/2028 (Transparence du 12 mars 2028)',
  name: 'Transparence du 12 mars 2028',
  observationsClosingDate: { year: 2028, month: 2, day: 1 },
  outcomes: [],
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
};

function renderActions(transparence: DetailedNominationSessionDto, onArchived = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[SESSION_PATH]}>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ConfirmModalProvider>
          <TransparenceActions onArchived={onArchived} transparence={transparence} />
          <CurrentPath />
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

  it('keeps the user on the session once archived', async () => {
    const user = userEvent.setup();
    const onArchived = vi.fn();
    renderActions({ ...NEW_SESSION, isArchivable: true, isValidated: true }, onArchived);

    await user.click(screen.getByRole('button', { name: 'Archiver' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(screen.getByText(SESSION_PATH)).toBeInTheDocument();
    expect(onArchived).toHaveBeenCalledOnce();
    expect(successToast).toHaveBeenCalledWith({
      title: 'Transparence "Transparence du 12 mars 2028" archivée',
    });
  });
});
