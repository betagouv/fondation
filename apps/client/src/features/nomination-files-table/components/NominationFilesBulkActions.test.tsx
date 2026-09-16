import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExcludedJurisdictionsContext } from '../context/excluded-jurisdictions.context';
import { NominationFilesTableContext } from '../context/files-table.context';
import { MemberExcludedJurisdictions } from '../context/member-excluded-jurisdictions';
import { ToastProvider } from '@/shared/ui/toast';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { NominationFilesBulkActions } from './NominationFilesBulkActions';

const affectReporters = vi.fn();
const defineOutcome = vi.fn();

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
}));

const OUTCOMES = [
  { commentRequired: false, label: 'Avis favorable', value: 'VALIDATED' as const },
  { commentRequired: true, label: 'Avis défavorable', value: 'NON_VALIDATED' as const },
];

function file(props: {
  id: string;
  nomMagistrat: string;
  outcome?: 'VALIDATED' | 'NON_VALIDATED';
  priorities?: readonly string[];
  reporters?: readonly { id: string }[];
}): SessionNominationFile {
  return {
    id: props.id,
    content: {
      jurisdictions: { current: null, targeted: null },
      nomMagistrat: props.nomMagistrat,
      numeroDeDossier: 1,
      outcome: props.outcome ? { comment: null, value: props.outcome } : null,
    },
    priorities: props.priorities ?? [],
    reporters: props.reporters ?? [],
  } as unknown as SessionNominationFile;
}

function renderActions(selectedFiles: readonly SessionNominationFile[]) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ToastProvider>
        <NominationFilesTableContext
          value={{ canManage: true, formation: 'PARQUET', outcomes: OUTCOMES, sessionId: 'session-1' }}
        >
          <ExcludedJurisdictionsContext value={MemberExcludedJurisdictions.fromMembers([])}>
            <NominationFilesBulkActions onClose={vi.fn()} selectedFiles={selectedFiles} />
          </ExcludedJurisdictionsContext>
        </NominationFilesTableContext>
      </ToastProvider>
    </IntlProvider>,
  );
}

const openDropdown = (name: RegExp) => userEvent.click(screen.getByRole('button', { name }));
const chooseOption = (name: string) => userEvent.click(screen.getByRole('option', { name }));

describe('NominationFilesBulkActions', () => {
  beforeEach(() => {
    affectReporters.mockReset();
    defineOutcome.mockReset();
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
    expect(screen.getByRole('button', { name: 'Choisir une issue' })).toHaveTextContent('FAVORABLE');
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
    expect(screen.getByRole('button', { name: 'Choisir une issue' })).toHaveTextContent('Sélectionner');
  });

  it('should withdraw a shared priority from every selected file', async () => {
    renderActions([
      file({ id: 'file-1', nomMagistrat: 'BOURDIEU Pierre', priorities: ['ETOILE'] }),
      file({ id: 'file-2', nomMagistrat: 'HARENDT Anna', priorities: ['ETOILE'] }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Retirer Étoilé' }));

    expect(affectReporters).toHaveBeenCalledWith(
      {
        affectations: [
          { nominationFileId: 'file-1', priorities: [], reporterIds: [] },
          { nominationFileId: 'file-2', priorities: [], reporterIds: [] },
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
          { nominationFileId: 'file-1', priorities: [], reporterIds: ['member-2', 'member-1'] },
          { nominationFileId: 'file-2', priorities: [], reporterIds: ['member-1'] },
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
      {
        affectations: [
          { nominationFileId: 'file-1', priorities: [], reporterIds: [] },
          { nominationFileId: 'file-2', priorities: [], reporterIds: ['member-2'] },
        ],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
  });

  it('should complete the priorities without dropping the reporters', async () => {
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

    expect(affectReporters).toHaveBeenCalledWith(
      {
        affectations: [
          { nominationFileId: 'file-1', priorities: ['ETOILE', 'OUTRE_MER'], reporterIds: ['member-1'] },
        ],
        sessionId: 'session-1',
      },
      expect.anything(),
    );
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

    rerender(
      <IntlProvider defaultLocale="fr" locale="fr">
        <ToastProvider>
          <NominationFilesTableContext
            value={{ canManage: true, formation: 'PARQUET', outcomes: OUTCOMES, sessionId: 'session-1' }}
          >
            <ExcludedJurisdictionsContext value={MemberExcludedJurisdictions.fromMembers([])}>
              <NominationFilesBulkActions onClose={vi.fn()} selectedFiles={[]} />
            </ExcludedJurisdictionsContext>
          </NominationFilesTableContext>
        </ToastProvider>
      </IntlProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Retirer Camille COMMUN' })).toBeNull();
  });

  it('should ignore an action taken without any selected file', async () => {
    renderActions([]);

    await openDropdown(/Choisir une issue/);
    await chooseOption('FAVORABLE');

    expect(defineOutcome).not.toHaveBeenCalled();
  });
});
