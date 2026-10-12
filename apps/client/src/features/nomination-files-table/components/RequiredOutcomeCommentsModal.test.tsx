import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { NominationFilesTableContext } from '../context/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { RequiredOutcomeCommentsModal } from './RequiredOutcomeCommentsModal';

const OUTCOMES = [
  { commentRequired: true, label: 'Avis défavorable', value: 'NON_VALIDATED' as const },
  { commentRequired: false, label: 'Avis favorable', value: 'VALIDATED' as const },
];

function file(id: string, nomMagistrat: string, comment: string | null = null): SessionNominationFile {
  return {
    id,
    content: {
      nomMagistrat,
      outcome: comment ? { comment, value: 'NON_VALIDATED' } : null,
    },
  } as SessionNominationFile;
}

function renderModal(files: readonly SessionNominationFile[]) {
  const onConfirm = vi.fn();
  const onDrop = vi.fn();

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesTableContext
        value={{ canManage: true, formation: 'PARQUET', outcomes: OUTCOMES, sessionId: 'session-1' }}
      >
        <RequiredOutcomeCommentsModal
          files={files}
          onClosed={vi.fn()}
          onConfirm={onConfirm}
          onDrop={onDrop}
          open
          outcome="NON_VALIDATED"
        />
      </NominationFilesTableContext>
    </IntlProvider>,
  );

  return { onConfirm, onDrop };
}

const save = () => screen.getByRole('button', { name: 'Sauvegarder' });

describe('RequiredOutcomeCommentsModal', () => {
  it('should ask for one comment per magistrate', () => {
    renderModal([file('file-1', 'BOURDIEU Pierre'), file('file-2', 'HARENDT Anna')]);

    expect(screen.getByText('Commentaires des 2 propositions')).toBeVisible();
    expect(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /HARENDT Anna/ })).toBeVisible();
  });

  it('should name the outcome that requires a comment', () => {
    renderModal([file('file-1', 'BOURDIEU Pierre')]);

    expect(screen.getByText(`L'issue "Avis défavorable" nécessite un commentaire`)).toBeVisible();
  });

  it('should prefill each field with the comment already recorded', () => {
    renderModal([file('file-1', 'BOURDIEU Pierre', 'Déjà motivé'), file('file-2', 'HARENDT Anna')]);

    expect(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ })).toHaveValue('Déjà motivé');
    expect(screen.getByRole('textbox', { name: /HARENDT Anna/ })).toHaveValue('');
  });

  it('should refuse to save while a single comment is missing', async () => {
    renderModal([file('file-1', 'BOURDIEU Pierre'), file('file-2', 'HARENDT Anna')]);

    expect(save()).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ }), 'Motif');

    expect(save()).toBeDisabled();
  });

  it('should refuse a comment made of blanks', async () => {
    renderModal([file('file-1', 'BOURDIEU Pierre')]);

    await userEvent.type(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ }), '   ');

    expect(save()).toBeDisabled();
  });

  it('should report a trimmed comment for each file', async () => {
    const { onConfirm } = renderModal([file('file-1', 'BOURDIEU Pierre'), file('file-2', 'HARENDT Anna')]);

    await userEvent.type(screen.getByRole('textbox', { name: /BOURDIEU Pierre/ }), '  Motif Bourdieu  ');
    await userEvent.type(screen.getByRole('textbox', { name: /HARENDT Anna/ }), 'Motif Harendt');
    await userEvent.click(save());

    expect(onConfirm).toHaveBeenCalledWith([
      { comment: 'Motif Bourdieu', nominationFileId: 'file-1' },
      { comment: 'Motif Harendt', nominationFileId: 'file-2' },
    ]);
  });

  it('should drop the whole batch on cancellation', async () => {
    const { onConfirm, onDrop } = renderModal([file('file-1', 'BOURDIEU Pierre')]);

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onDrop).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
