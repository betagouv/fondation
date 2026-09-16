import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordEditTransparenceModal } from './TableauDeBordEditTransparenceModal';

const mocks = vi.hoisted(() => ({
  updateNominationSession: vi.fn(),
  validateSession: vi.fn(),
}));

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }));

vi.mock('@queries/nomination-sessions.queries', () => ({
  useArchiveNominationSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNominationSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateNominationSessionMutation: () => ({
    mutate: mocks.updateNominationSession,
    isPending: false,
  }),
  useValidateSessionMutation: () => ({ mutate: mocks.validateSession, isPending: false }),
}));

vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ error: vi.fn(), success: vi.fn() }) }));

const SESSION: DetailedNominationSessionDto = {
  id: 'session-1',
  name: 'Transparence du 12 mars 2028',
  formation: 'SIEGE',
  outcomes: [],
  date: { year: 2028, month: 3, day: 12 },
  observationsClosingDate: { year: 2028, month: 2, day: 1 },
  dueDate: { year: 2028, month: 4, day: 1 },
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
  isValidated: false,
  isDeletable: true,
  isArchived: false,
  isArchivable: true,
};

const onClose = vi.fn();

function renderModal(session: DetailedNominationSessionDto = SESSION) {
  return render(
    <MemoryRouter>
      <IntlProvider defaultLocale="fr" locale="fr">
        <ConfirmModalProvider>
          <TableauDeBordEditTransparenceModal onClose={onClose} onClosed={vi.fn()} open session={session} />
        </ConfirmModalProvider>
      </IntlProvider>
    </MemoryRouter>,
  );
}

const saveButton = () => screen.getByRole('button', { name: 'Enregistrer' });

beforeEach(() => {
  mocks.updateNominationSession.mockClear();
  mocks.validateSession.mockClear();
  onClose.mockClear();
});

describe('TableauDeBordEditTransparenceModal', () => {
  it('should keep the save button off until something changes', () => {
    renderModal();

    expect(saveButton()).toBeDisabled();
  });

  it('should drop an optional date cleared by the reader instead of refusing it', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Date d'échéance"));
    await user.click(saveButton());

    expect(screen.queryByText('Format de date invalide')).not.toBeInTheDocument();
    expect(mocks.updateNominationSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDate: null, positionStartDate: null }),
      }),
      expect.any(Object),
    );
  });

  it('should close only once the session validation has settled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Date d'échéance"));
    await user.click(saveButton());

    const [, updateHandlers] = mocks.updateNominationSession.mock.calls[0];
    updateHandlers.onSuccess();

    expect(onClose).not.toHaveBeenCalled();

    const [, validateHandlers] = mocks.validateSession.mock.calls[0];
    validateHandlers.onSettled();

    expect(onClose).toHaveBeenCalled();
  });

  it('should offer the transparence actions under the form', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Archiver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
  });

  it('should drop the actions section when neither action is possible', () => {
    renderModal({ ...SESSION, isArchivable: false, isDeletable: false });

    expect(screen.queryByText('Actions sur la transparence')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('should close right away on an already validated session', async () => {
    const user = userEvent.setup();
    renderModal({ ...SESSION, isValidated: true });

    await user.clear(screen.getByLabelText("Date d'échéance"));
    await user.click(saveButton());

    mocks.updateNominationSession.mock.calls[0][1].onSuccess();

    expect(mocks.validateSession).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
