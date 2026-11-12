import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExcludedJurisdictionsContext } from '../context/excluded-jurisdictions.context';
import { NominationFilesTableContext } from '../context/files-table.context';
import { MemberExcludedJurisdictions } from '../context/member-excluded-jurisdictions';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFilesBulkActions } from './NominationFilesBulkActions';

const affectReporters = vi.fn();
const defineOutcome = vi.fn();
const recuseMembers = vi.fn();
const updatePriorities = vi.fn();

vi.mock('@queries/members.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useMemberListQuery: () => ({
    data: {
      items: [
        { firstName: 'Camille', id: 'member-1', lastName: 'COMMUN' },
        { firstName: 'Sophie', id: 'member-2', lastName: 'PARQUET' },
      ],
    },
  }),
}));

vi.mock('@queries/nomination-sessions.queries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAffectNominationFilesReportersMutation: () => ({ isPending: false, mutate: affectReporters }),
  useDefineNominationFilesOutcomeMutation: () => ({ isPending: false, mutate: defineOutcome }),
  useRecuseNominationFilesMembersMutation: () => ({ isPending: false, mutate: recuseMembers }),
  useUpdateNominationFilesPrioritiesMutation: () => ({ isPending: false, mutate: updatePriorities }),
}));

const OUTCOMES = [
  { commentRequired: false, label: 'Avis favorable', value: 'VALIDATED' as const },
  { commentRequired: true, label: 'Avis défavorable', value: 'NON_VALIDATED' as const },
];

const CAMILLE = { firstName: 'Camille', id: 'member-1', lastName: 'COMMUN' };
const SOPHIE = { firstName: 'Sophie', id: 'member-2', lastName: 'PARQUET' };

function file(props: {
  canRecuseMembers?: boolean;
  id: string;
  nomMagistrat: string;
  nonAffectableMemberIds?: readonly string[];
  nonRecusableMemberIds?: readonly string[];
  outcome?: 'VALIDATED' | 'NON_VALIDATED';
  priorities?: readonly string[];
  recusedMembers?: SessionNominationFile['recusedMembers'];
  reporters?: readonly { id: string }[];
}): SessionNominationFile {
  return {
    canRecuseMembers: props.canRecuseMembers ?? true,
    content: {
      jurisdictions: { current: null, targeted: null },
      nomMagistrat: props.nomMagistrat,
      numeroDeDossier: 1,
      outcome: props.outcome ? { comment: null, value: props.outcome } : null,
      posteCible: 'Substitut du procureur près le TJ de Lyon',
    },
    id: props.id,
    nonAffectableMembers: (props.nonAffectableMemberIds ?? []).map((id) => ({ id, reason: 'RECUSED' })),
    nonRecusableMembers: (props.nonRecusableMemberIds ?? []).map((id) => ({ id, reason: 'REPORTER' })),
    priorities: props.priorities ?? [],
    recusedMembers: props.recusedMembers ?? [],
    reporters: props.reporters ?? [],
  } as unknown as SessionNominationFile;
}

function actions(selectedFiles: readonly SessionNominationFile[]) {
  return (
    <IntlProvider defaultLocale="fr" locale="fr">
      <ToastProvider>
        <ConfirmModalProvider>
          <NominationFilesTableContext
            value={{ canManage: true, formation: 'PARQUET', outcomes: OUTCOMES, sessionId: 'session-1' }}
          >
            <ExcludedJurisdictionsContext value={MemberExcludedJurisdictions.fromMembers([])}>
              <NominationFilesBulkActions onClose={vi.fn()} selectedFiles={selectedFiles} />
            </ExcludedJurisdictionsContext>
          </NominationFilesTableContext>
        </ConfirmModalProvider>
      </ToastProvider>
    </IntlProvider>
  );
}

function renderActions(selectedFiles: readonly SessionNominationFile[]) {
  return render(actions(selectedFiles));
}

const openDropdown = (name: RegExp) => userEvent.click(screen.getByRole('button', { name }));
const chooseOption = (name: string) => userEvent.click(screen.getByRole('option', { name }));

describe('NominationFilesBulkActions', () => {
  beforeEach(() => {
    affectReporters.mockReset();
    defineOutcome.mockReset();
    recuseMembers.mockReset();
    updatePriorities.mockReset();
  });

  it('should show the recused members shared by every selected file', () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', recusedMembers: [SOPHIE] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', recusedMembers: [SOPHIE] }),
    ]);

    expect(screen.getByRole('button', { name: 'Retirer Sophie PARQUET' })).toBeVisible();
  });

  it('should complete the recused members of each file instead of replacing them', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', recusedMembers: [SOPHIE] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');

    expect(recuseMembers).toHaveBeenCalledWith(
      {
        items: [
          { memberIds: ['member-2', 'member-1'], nominationFileId: 'file-1' },
          { memberIds: ['member-1'], nominationFileId: 'file-2' },
        ],
      },
      expect.anything(),
    );
  });

  it('should withdraw a recused member only from the files that carried them', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', recusedMembers: [CAMILLE] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', recusedMembers: [SOPHIE] }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');
    await chooseOption('Camille COMMUN');

    expect(recuseMembers).toHaveBeenLastCalledWith(
      {
        items: [
          { memberIds: [], nominationFileId: 'file-1' },
          { memberIds: ['member-2'], nominationFileId: 'file-2' },
        ],
      },
      expect.anything(),
    );
  });

  it('should recuse a reporter only on the propositions they do not report', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonRecusableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Déporter un rapporteur' });
    expect(dialog).toHaveTextContent(
      'Vous souhaitez enregistrer le déport de Camille COMMUN sur la proposition de nomination de BOURDIEU Pierre (Substitut du procureur près le TJ de Lyon), dont ce membre est rapporteur. Pour pouvoir enregistrer ce déport, vous devez au préalable modifier le rapporteur, puis publier la nouvelle affectation si ce membre est rapporteur dans la version publiée. Le déport sera bien enregistré sur les autres propositions sélectionnées.',
    );
    expect(recuseMembers).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Déporter' }));

    expect(recuseMembers).toHaveBeenCalledWith(
      {
        items: [
          { memberIds: [], nominationFileId: 'file-1' },
          { memberIds: ['member-1'], nominationFileId: 'file-2' },
        ],
      },
      expect.anything(),
    );
  });

  it('should list the members and the propositions they report', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonRecusableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', nonRecusableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-3', nomMagistrat: 'WEIL Simone' }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Déporter un rapporteur' });
    expect(within(dialog).getByRole('listitem')).toHaveTextContent(
      'Camille COMMUN : BOURDIEU Pierre (Substitut du procureur près le TJ de Lyon), HARENDT Anna (Substitut du procureur près le TJ de Lyon)',
    );
    expect(dialog).toHaveTextContent(
      'Les déports seront bien enregistrés sur les autres propositions sélectionnées.',
    );
  });

  it('should only close when the member reports every selected proposition', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonRecusableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', nonRecusableMemberIds: [CAMILLE.id] }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Déporter un rapporteur' });
    expect(dialog).not.toHaveTextContent('autres propositions sélectionnées');
    expect(within(dialog).queryByRole('button', { name: 'Déporter' })).toBeNull();

    const [close] = within(dialog).getAllByRole('button', { name: 'Fermer' }).reverse();
    await userEvent.click(close!);

    expect(recuseMembers).not.toHaveBeenCalled();
  });

  it('should recuse nobody when the secretariat cancels', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonRecusableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Membres déportés/);
    await chooseOption('Camille COMMUN');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(recuseMembers).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Retirer Camille COMMUN' })).toBeNull();
  });

  it('should withdraw the recusal of a reporter without asking', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        recusedMembers: [CAMILLE],
        reporters: [CAMILLE],
      }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', recusedMembers: [CAMILLE] }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Camille COMMUN' }));

    expect(screen.queryByRole('dialog', { name: /Déporter/ })).toBeNull();
    expect(recuseMembers).toHaveBeenCalledWith(
      {
        items: [
          { memberIds: [], nominationFileId: 'file-1' },
          { memberIds: [], nominationFileId: 'file-2' },
        ],
      },
      expect.anything(),
    );
  });

  it('should leave out the recusal when the API keeps it from one of the selected files', () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre' }),
      file({ canRecuseMembers: false, id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    expect(screen.queryByRole('button', { name: /Membres déportés/ })).toBeNull();
  });

  it('should show the reporters, the priorities and the outcome shared by every selected file', () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        outcome: 'VALIDATED',
        priorities: ['ETOILE'],
        reporters: [{ id: 'member-1' }],
      }),
      file({
        id: 'file-2',
        nomMagistrat: 'HARENDT Anna',
        outcome: 'VALIDATED',
        priorities: ['ETOILE'],
        reporters: [{ id: 'member-1' }],
      }),
    ]);

    expect(screen.getByRole('button', { name: 'Retirer Camille COMMUN' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retirer Étoilé' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Choisir une issue FAVORABLE' })).toBeVisible();
  });

  it('should show nothing when the selected files carry different values', () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        outcome: 'VALIDATED',
        priorities: ['ETOILE'],
        reporters: [{ id: 'member-1' }],
      }),
      file({
        id: 'file-2',
        nomMagistrat: 'HARENDT Anna',
        priorities: ['ETOILE', 'OUTRE_MER'],
        reporters: [{ id: 'member-1' }, { id: 'member-2' }],
      }),
    ]);

    expect(screen.queryByRole('button', { name: 'Retirer Camille COMMUN' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retirer Étoilé' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Choisir une issue Sélectionner' })).toBeVisible();
  });

  it('should withdraw a shared priority from every selected file', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', priorities: ['ETOILE'] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', priorities: ['ETOILE'] }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Étoilé' }));

    expect(updatePriorities).toHaveBeenCalledWith(
      {
        items: [
          { nominationFileId: 'file-1', priorities: [] },
          { nominationFileId: 'file-2', priorities: [] },
        ],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
  });

  it('should complete the reporters already affected instead of replacing them', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        reporters: [{ id: 'member-2' }],
      }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');

    expect(affectReporters).toHaveBeenCalledWith(
      {
        affectations: [
          { nominationFileId: 'file-1', reporterIds: ['member-2', 'member-1'] },
          { nominationFileId: 'file-2', reporterIds: ['member-1'] },
        ],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
  });

  it('should withdraw a reporter only from the files that carried it', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        reporters: [{ id: 'member-1' }],
      }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', reporters: [{ id: 'member-2' }] }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');
    await chooseOption('Camille COMMUN');

    expect(affectReporters).toHaveBeenLastCalledWith(
      { affectations: [{ nominationFileId: 'file-1', reporterIds: [] }], sessionId: 'session-1' },
      expect.anything(),
    );
  });

  it('should affect a recused member only on the propositions they did not recuse from', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        nonAffectableMemberIds: [CAMILLE.id],
        recusedMembers: [CAMILLE],
      }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Affecter un membre déporté' });
    expect(dialog).toHaveTextContent(
      "Vous souhaitez affecter Camille COMMUN à la proposition de nomination de BOURDIEU Pierre (Substitut du procureur près le TJ de Lyon), dont ce membre s'est déporté. Pour pouvoir l'affecter, vous devez au préalable retirer son déport. L'affectation sera bien enregistrée sur les autres propositions sélectionnées.",
    );
    expect(affectReporters).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Affecter' }));

    expect(affectReporters).toHaveBeenCalledWith(
      { affectations: [{ nominationFileId: 'file-2', reporterIds: ['member-1'] }], sessionId: 'session-1' },
      expect.anything(),
    );
  });

  it('should list the members and the propositions they recused from', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonAffectableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', nonAffectableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-3', nomMagistrat: 'WEIL Simone' }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Affecter un membre déporté' });
    expect(dialog).toHaveTextContent(
      'Vous souhaitez affecter des membres à des propositions de nomination dont ils se sont déportés :',
    );
    expect(within(dialog).getByRole('listitem')).toHaveTextContent(
      'Camille COMMUN : BOURDIEU Pierre (Substitut du procureur près le TJ de Lyon), HARENDT Anna (Substitut du procureur près le TJ de Lyon)',
    );
    expect(dialog).toHaveTextContent(
      "Pour pouvoir les affecter, vous devez au préalable retirer leur déport. L'affectation sera bien enregistrée sur les autres propositions sélectionnées.",
    );
  });

  it('should only close when the member recused from every selected proposition', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonAffectableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', nonAffectableMemberIds: [CAMILLE.id] }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');

    const dialog = screen.getByRole('dialog', { name: 'Affecter un membre déporté' });
    expect(dialog).not.toHaveTextContent('autres propositions sélectionnées');
    expect(within(dialog).queryByRole('button', { name: 'Affecter' })).toBeNull();

    const [close] = within(dialog).getAllByRole('button', { name: 'Fermer' }).reverse();
    await userEvent.click(close!);

    expect(affectReporters).not.toHaveBeenCalled();
  });

  it('should affect nobody when the secretariat cancels', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', nonAffectableMemberIds: [CAMILLE.id] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(affectReporters).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Retirer Camille COMMUN' })).toBeNull();
  });

  it('should empty the reporters of every selected file', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        priorities: ['ETOILE'],
        reporters: [{ id: 'member-1' }],
      }),
      file({
        id: 'file-2',
        nomMagistrat: 'HARENDT Anna',
        reporters: [{ id: 'member-1' }, { id: 'member-2' }],
      }),
    ]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Aucun');

    expect(affectReporters).toHaveBeenCalledWith(
      {
        affectations: [
          { nominationFileId: 'file-1', reporterIds: [] },
          { nominationFileId: 'file-2', reporterIds: [] },
        ],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
  });

  it('should complete the priorities without touching the affectation', async () => {
    renderActions([
      file({
        id: 'file-1',
        nomMagistrat: 'BOURDIEU Pierre',
        priorities: ['ETOILE'],
        reporters: [{ id: 'member-1' }],
      }),
    ]);

    await openDropdown(/Définir une priorité/);
    await chooseOption('Outre-mer');

    expect(updatePriorities).toHaveBeenCalledWith(
      {
        items: [{ nominationFileId: 'file-1', priorities: ['ETOILE', 'OUTRE_MER'] }],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
    expect(affectReporters).not.toHaveBeenCalled();
  });

  it('should apply an outcome that needs no comment right away', async () => {
    renderActions([file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre' })]);

    await openDropdown(/Choisir une issue/);
    await chooseOption('FAVORABLE');

    expect(defineOutcome).toHaveBeenCalledWith(
      { items: [{ comment: null, nominationFileId: 'file-1' }], outcome: 'VALIDATED' },
      expect.anything(),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should ask for the comments before applying an outcome that requires one', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre' }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Choisir une issue/);
    await chooseOption('DÉFAVORABLE');

    expect(defineOutcome).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /HARENDT Anna/ })).toBeVisible();
  });

  it('should send one comment per file once they are filled', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre' }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna' }),
    ]);

    await openDropdown(/Choisir une issue/);
    await chooseOption('DÉFAVORABLE');

    await userEvent.type(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ }), 'Motif Bourdieu');
    await userEvent.type(screen.getByRole('textbox', { name: /HARENDT Anna/ }), 'Motif Harendt');
    await userEvent.click(screen.getByRole('button', { name: 'Sauvegarder' }));

    expect(defineOutcome).toHaveBeenCalledWith(
      {
        items: [
          { comment: 'Motif Bourdieu', nominationFileId: 'file-1' },
          { comment: 'Motif Harendt', nominationFileId: 'file-2' },
        ],
        outcome: 'NON_VALIDATED',
      },
      expect.anything(),
    );
  });

  it('should empty the dropdowns when the selection is dropped', async () => {
    const { rerender } = renderActions([file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre' })]);

    await openDropdown(/Affecter un rapporteur/);
    await chooseOption('Camille COMMUN');
    expect(screen.getByRole('button', { name: 'Retirer Camille COMMUN' })).toBeVisible();

    rerender(actions([]));

    expect(screen.queryByRole('button', { name: 'Retirer Camille COMMUN' })).toBeNull();
  });

  it('should ignore an action taken without any selected file', async () => {
    renderActions([]);

    await openDropdown(/Choisir une issue/);
    await chooseOption('FAVORABLE');

    expect(defineOutcome).not.toHaveBeenCalled();
  });
});
