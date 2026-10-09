import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { NominationFilesTableContext } from '@/features/nomination-files-table/context/files-table.context';
import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';

import { NominationFileOutcomeCommentModal } from './NominationFileOutcomeCommentModal';
import type { CurrentOutcome } from './OutcomeCommentModalContext';

const OUTCOMES = [
  { commentRequired: true, label: 'Avis défavorable', value: 'NON_VALIDATED' as const },
  { commentRequired: false, label: 'Avis favorable', value: 'VALIDATED' as const },
];

function renderModal(props: { current: CurrentOutcome; outcome: NominationFileOutcomeEnum }) {
  const onComment = vi.fn();

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesTableContext
        value={{ canManage: true, formation: 'PARQUET', outcomes: OUTCOMES, sessionId: 'session-1' }}
      >
        <NominationFileOutcomeCommentModal
          current={props.current}
          onClosed={vi.fn()}
          onComment={onComment}
          onDrop={vi.fn()}
          open
          outcome={props.outcome}
        />
      </NominationFilesTableContext>
    </IntlProvider>,
  );

  return { onComment };
}

const save = () => screen.getByRole('button', { name: 'Sauvegarder' });

describe('NominationFileOutcomeCommentModal', () => {
  it('should save the existing comment when the outcome changes to one requiring a comment', async () => {
    const { onComment } = renderModal({
      current: { comment: 'Déjà écrit', outcome: 'VALIDATED' },
      outcome: 'NON_VALIDATED',
    });

    await userEvent.click(save());

    expect(onComment).toHaveBeenCalledWith('Déjà écrit');
  });

  it('should not save an unchanged comment on the same outcome', () => {
    renderModal({ current: { comment: 'Déjà écrit', outcome: 'NON_VALIDATED' }, outcome: 'NON_VALIDATED' });

    expect(save()).toBeDisabled();
  });
});
