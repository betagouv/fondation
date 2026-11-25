import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/shared/ui/toast';
import { httpAssert } from '@/utils/http-exception';
import * as $api from '@api/sdk';
import type { FoundCallForApplicationsFormDto } from '@api/types';
import type { CallForApplications } from '@queries/calls-for-applications.queries';

import { CallForApplicationsModal } from './CallForApplicationsModal';

const FORM: FoundCallForApplicationsFormDto = {
  commentMaxLength: 50_000,
  dateRange: { max: '2100-12-31', min: '2000-01-01' },
  targetPositions: [
    { id: 'FIRST_PRESIDENT', label: 'Premier président' },
    { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
    { id: 'COUNSELLOR', label: 'Conseiller' },
    { id: 'REFERENDARY_COUNSELLOR', label: 'Conseiller référendaire' },
    { id: 'AUDITOR_SECOND_GRADE', label: 'Auditeur 2nd grade' },
    { id: 'AUDITOR_FIRST_GRADE', label: 'Auditeur 1er grade' },
  ],
  types: [
    {
      id: 'GENERAL',
      label: 'Général',
      scope: 'Vise tous les postes de CA et de TJ',
      targetPositionsRequired: false,
    },
  ],
};

/** what the client of the API throws on a 400 naming what to fix */
function refusal(validationError: string): unknown {
  try {
    httpAssert(Response.json({ validationError }, { status: 400 }));
  } catch (error) {
    return error;
  }
}

function renderModal(edited: CallForApplications | null = null) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <QueryClientProvider client={client}>
        <ToastProvider>
          <CallForApplicationsModal edited={edited} onClose={onClose} onClosed={vi.fn()} open />
        </ToastProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );

  return { onClose };
}

describe('CallForApplicationsModal', () => {
  beforeEach(() => {
    vi.spyOn($api.callsForApplications, 'findCallForApplicationsForm').mockResolvedValue({
      data: FORM,
    } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it('creates a call of the only type, telling what it targets, without the dates left empty', async () => {
    const create = vi
      .spyOn($api.callsForApplications, 'createCallForApplications')
      .mockResolvedValue({ data: { id: 'call-1' } } as never);
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await screen.findByRole('textbox', { name: 'Commentaire' });
    expect(screen.getByText('Vise tous les postes de CA et de TJ')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          comment: null,
          deadline: null,
          publishedOn: null,
          targetPositions: [],
          type: 'GENERAL',
        },
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open and says so when the creation fails', async () => {
    vi.spyOn($api.callsForApplications, 'createCallForApplications').mockRejectedValue(new Error('500'));
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await screen.findByRole('textbox', { name: 'Commentaire' });
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La création a échoué, réessayez');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('tells why the API refuses the call', async () => {
    vi.spyOn($api.callsForApplications, 'createCallForApplications').mockRejectedValue(
      refusal('La date limite ne peut pas précéder la date de publication'),
    );
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await screen.findByRole('textbox', { name: 'Commentaire' });
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(
      await screen.findByText('La date limite ne peut pas précéder la date de publication'),
    ).toBeInTheDocument();
    expect(screen.queryByText('La création a échoué, réessayez')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates the call it opens on, with the values it holds', async () => {
    const update = vi
      .spyOn($api.callsForApplications, 'updateCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    const { onClose } = renderModal({
      canChange: true,
      comment: 'Postes vacants',
      createdOn: { day: 20, month: 11, year: 2026 },
      deadline: { day: 15, month: 1, year: 2027 },
      history: [],
      id: 'call-1',
      publishedOn: { day: 1, month: 12, year: 2026 },
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetLabel: 'CA et TJ',
      targetPositions: [],
      type: { id: 'GENERAL', label: 'Général' },
    });
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), ' et créés');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          comment: 'Postes vacants et créés',
          deadline: '2027-01-15',
          publishedOn: '2026-12-01',
          targetPositions: [],
          type: 'GENERAL',
        },
        path: { callId: 'call-1' },
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('saves nothing while the form still holds the values saved', async () => {
    renderModal({
      canChange: true,
      comment: null,
      createdOn: { day: 20, month: 11, year: 2026 },
      deadline: null,
      history: [],
      id: 'call-1',
      publishedOn: null,
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetLabel: 'CA et TJ',
      targetPositions: [],
      type: { id: 'GENERAL', label: 'Général' },
    });
    const user = userEvent.setup();
    const comment = await screen.findByRole('textbox', { name: 'Commentaire' });
    const save = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    expect(save).toBeDisabled();
    await user.type(comment, 'Postes vacants');
    expect(save).toBeEnabled();
  });

  it('creates a call for the Cour de cassation once a position is picked', async () => {
    vi.spyOn($api.callsForApplications, 'findCallForApplicationsForm').mockResolvedValue({
      data: {
        ...FORM,
        types: [
          ...FORM.types,
          {
            id: 'CCASS',
            label: 'Cour de cassation',
            scope: 'Vise les postes de la Cour de cassation choisis',
            targetPositionsRequired: true,
          },
        ],
      },
    } as never);
    const create = vi
      .spyOn($api.callsForApplications, 'createCallForApplications')
      .mockResolvedValue({ data: { id: 'call-1' } } as never);
    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'CCASS');
    const save = screen.getByRole('button', { name: "Créer l'appel à candidatures" });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Conseiller' }));
    await user.click(screen.getByRole('checkbox', { name: 'Premier président' }));
    await user.click(save);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ targetPositions: ['FIRST_PRESIDENT', 'COUNSELLOR'], type: 'CCASS' }),
      }),
    );
  });
});
