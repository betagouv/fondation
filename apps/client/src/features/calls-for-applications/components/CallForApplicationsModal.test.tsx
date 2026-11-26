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
  targetCourtTypes: [
    {
      courts: [
        { id: 'CA  AGEN', label: "Cour d'appel d'Agen", type: 'COURT_OF_APPEAL' },
        { id: 'CA  LYON', label: "Cour d'appel de Lyon", type: 'COURT_OF_APPEAL' },
        {
          id: 'TSA SAINT PIERRE ET MIQUELON',
          label: "Tribunal supérieur d'appel de Saint-Pierre et Miquelon",
          type: 'COURT_OF_APPEAL',
        },
      ],
      guidelinesAdaptationLabel:
        "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les cours d'appel",
      type: { id: 'COURT_OF_APPEAL', label: "Cours d'appel" },
    },
    {
      courts: [
        { id: 'TJ  AGEN', label: "Tribunal judiciaire d'Agen", type: 'JUDICIAL_COURT' },
        { id: 'TJ  AUCH', label: "Tribunal judiciaire d'Auch", type: 'JUDICIAL_COURT' },
        { id: 'TPI NOUMEA', label: 'Tribunal de première instance de Nouméa', type: 'JUDICIAL_COURT' },
      ],
      guidelinesAdaptationLabel:
        "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les tribunaux judiciaires",
      type: { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
    },
  ],
  targetPositions: [
    { id: 'FIRST_PRESIDENT', label: 'Premier président' },
    { id: 'CHAMBER_PRESIDENT', label: 'Président de chambre' },
    { id: 'COUNSELLOR', label: 'Conseiller' },
    { id: 'REFERENDARY_COUNSELLOR', label: 'Conseiller référendaire' },
    { id: 'AUDITOR_SECOND_GRADE', label: 'Auditeur 2e grade' },
    { id: 'AUDITOR_FIRST_GRADE', label: 'Auditeur 1er grade' },
  ],
  types: [
    {
      type: { id: 'GENERAL', label: 'Général' },
      scope: "Vise tous les postes des cours d'appel et des tribunaux judiciaires",
      targetPick: 'NONE',
    },
    {
      type: { id: 'SPECIFIC', label: 'Spécifique' },
      scope: 'Vise la présidence des juridictions choisies',
      targetPick: 'COURTS',
    },
    {
      type: { id: 'CCASS', label: 'Cour de cassation' },
      scope: 'Vise les postes de la Cour de cassation choisis',
      targetPick: 'POSITIONS',
    },
  ],
};

const SAVED = {
  canChange: true,
  comment: null,
  createdOn: { day: 20, month: 11, year: 2026 },
  deadline: null,
  guidelinesAdaptations: [],
  history: [],
  id: 'call-1',
  publishedOn: null,
  status: { id: 'UNPUBLISHED', label: 'Non publié' },
  targetCourts: [],
  targetLabel: "Cours d'appel et tribunaux judiciaires",
  targetPositions: [],
  type: { id: 'GENERAL', label: 'Général' },
} satisfies CallForApplications;

function adaptationOf(group: string): string {
  return `Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les ${group}`;
}

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

  it('creates a general call telling what it targets without the dates left empty', async () => {
    const create = vi
      .spyOn($api.callsForApplications, 'createCallForApplications')
      .mockResolvedValue({ data: { id: 'call-1' } } as never);
    const { onClose } = renderModal();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'GENERAL');
    expect(
      screen.getByText("Vise tous les postes des cours d'appel et des tribunaux judiciaires"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          comment: null,
          deadline: null,
          guidelinesAdaptations: [],
          publishedOn: null,
          targetCourts: [],
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

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'GENERAL');
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

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'GENERAL');
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(
      await screen.findByText('La date limite ne peut pas précéder la date de publication'),
    ).toBeInTheDocument();
    expect(screen.queryByText('La création a échoué, réessayez')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates the call it opens on with the values it holds', async () => {
    const update = vi
      .spyOn($api.callsForApplications, 'updateCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    const { onClose } = renderModal({
      ...SAVED,
      comment: 'Postes vacants',
      deadline: { day: 15, month: 1, year: 2027 },
      publishedOn: { day: 1, month: 12, year: 2026 },
    });
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox', { name: 'Commentaire' }), ' et créés');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          comment: 'Postes vacants et créés',
          deadline: '2027-01-15',
          guidelinesAdaptations: [],
          publishedOn: '2026-12-01',
          targetCourts: [],
          targetPositions: [],
          type: 'GENERAL',
        },
        path: { callId: 'call-1' },
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('saves nothing while the form still holds the values saved', async () => {
    renderModal(SAVED);
    const user = userEvent.setup();
    const comment = await screen.findByRole('textbox', { name: 'Commentaire' });
    const save = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    expect(save).toBeDisabled();
    await user.type(comment, 'Postes vacants');
    expect(save).toBeEnabled();
  });

  it('opens a call for the Cour de cassation on its positions and saves a position added', async () => {
    const update = vi
      .spyOn($api.callsForApplications, 'updateCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    renderModal({
      ...SAVED,
      targetLabel: 'Premier président et Conseiller',
      targetPositions: [
        { id: 'FIRST_PRESIDENT', label: 'Premier président' },
        { id: 'COUNSELLOR', label: 'Conseiller' },
      ],
      type: { id: 'CCASS', label: 'Cour de cassation' },
    });
    const user = userEvent.setup();
    const chamberPresident = await screen.findByRole('checkbox', { name: 'Président de chambre' });
    const save = screen.getByRole('button', { name: 'Enregistrer les modifications' });

    expect(screen.getByRole('checkbox', { name: 'Premier président' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Conseiller' })).toBeChecked();
    await user.click(chamberPresident);
    await user.click(chamberPresident);
    expect(save).toBeDisabled();
    await user.click(chamberPresident);
    await user.click(save);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          targetPositions: ['FIRST_PRESIDENT', 'CHAMBER_PRESIDENT', 'COUNSELLOR'],
        }),
      }),
    );
  });

  it('creates a specific call once a court found by a search is picked', async () => {
    const create = vi
      .spyOn($api.callsForApplications, 'createCallForApplications')
      .mockResolvedValue({ data: { id: 'call-1' } } as never);
    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'SPECIFIC');
    const save = screen.getByRole('button', { name: "Créer l'appel à candidatures" });
    await user.click(screen.getByRole('checkbox', { name: 'Tribunaux judiciaires' }));
    expect(save).toBeDisabled();
    await user.type(
      screen.getByRole('textbox', { name: 'Rechercher une juridiction parmi les tribunaux judiciaires' }),
      'auch',
    );
    expect(screen.queryByRole('checkbox', { name: "Tribunal judiciaire d'Agen" })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" }));
    await user.click(save);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ targetCourts: ['TJ  AUCH'], type: 'SPECIFIC' }),
      }),
    );
  });

  it('waits for a court in each type checked before creating a specific call', async () => {
    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'SPECIFIC');
    await user.click(screen.getByRole('checkbox', { name: "Cours d'appel" }));
    await user.click(screen.getByRole('checkbox', { name: 'Tribunaux judiciaires' }));
    await user.click(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" }));
    const save = screen.getByRole('button', { name: "Créer l'appel à candidatures" });

    expect(save).toBeDisabled();
    expect(
      screen.getByText("Choisissez au moins une juridiction parmi les cours d'appel"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: "Cour d'appel d'Agen" }));
    expect(save).toBeEnabled();
  });

  it('opens a specific call on its courts and drops those of a type unchecked with its adaptation', async () => {
    const update = vi
      .spyOn($api.callsForApplications, 'updateCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    renderModal({
      ...SAVED,
      guidelinesAdaptations: [
        { id: 'COURT_OF_APPEAL', label: "Cours d'appel" },
        { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
      ],
      targetCourts: [
        { id: 'CA  AGEN', label: "Cour d'appel d'Agen", type: 'COURT_OF_APPEAL' },
        { id: 'TJ  AUCH', label: "Tribunal judiciaire d'Auch", type: 'JUDICIAL_COURT' },
      ],
      targetLabel: "Cour d'appel d'Agen et Tribunal judiciaire d'Auch",
      type: { id: 'SPECIFIC', label: 'Spécifique' },
    });
    const user = userEvent.setup();

    expect(await screen.findByRole('checkbox', { name: "Cour d'appel d'Agen" })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: adaptationOf("cours d'appel") })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: "Cours d'appel" }));
    expect(screen.queryByRole('checkbox', { name: "Cour d'appel d'Agen" })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: adaptationOf("cours d'appel") })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: "Cours d'appel" }));
    expect(screen.getByRole('checkbox', { name: adaptationOf("cours d'appel") })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: "Cours d'appel" }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          guidelinesAdaptations: ['JUDICIAL_COURT'],
          targetCourts: ['TJ  AUCH'],
        }),
      }),
    );
  });

  it('offers the adaptation of the guidelines only under a type of court checked', async () => {
    const create = vi
      .spyOn($api.callsForApplications, 'createCallForApplications')
      .mockResolvedValue({ data: { id: 'call-1' } } as never);
    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByRole('combobox', { name: /Type d'appel/ }), 'SPECIFIC');
    await user.click(screen.getByRole('checkbox', { name: 'Tribunaux judiciaires' }));
    expect(screen.queryByRole('checkbox', { name: adaptationOf("cours d'appel") })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" }));
    await user.click(screen.getByRole('checkbox', { name: adaptationOf('tribunaux judiciaires') }));
    await user.click(screen.getByRole('button', { name: "Créer l'appel à candidatures" }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ guidelinesAdaptations: ['JUDICIAL_COURT'] }),
      }),
    );
  });

  it('shows checked a court removed from the referential since the call targeted it', async () => {
    const update = vi
      .spyOn($api.callsForApplications, 'updateCallForApplications')
      .mockResolvedValue({ data: undefined } as never);
    renderModal({
      ...SAVED,
      targetCourts: [
        { id: 'CA  AGEN', label: "Cour d'appel d'Agen", type: 'COURT_OF_APPEAL' },
        { id: 'TSA MAMOUDZOU', label: "Tribunal supérieur d'appel de Mamoudzou", type: 'COURT_OF_APPEAL' },
      ],
      targetLabel: "Cour d'appel d'Agen et Tribunal supérieur d'appel de Mamoudzou",
      type: { id: 'SPECIFIC', label: 'Spécifique' },
    });
    const user = userEvent.setup();
    const removed = await screen.findByRole('checkbox', { name: "Tribunal supérieur d'appel de Mamoudzou" });

    expect(removed).toBeChecked();
    await user.click(removed);
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ targetCourts: ['CA  AGEN'] }) }),
    );
  });

  it('creates a call for the Cour de cassation once a position is picked', async () => {
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
