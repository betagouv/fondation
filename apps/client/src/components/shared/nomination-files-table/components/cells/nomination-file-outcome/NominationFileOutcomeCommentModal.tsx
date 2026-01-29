import type { FormationEnum } from '@/types/enums.types';
import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import React from 'react';
import { OutcomeCommentModalContext } from './OutcomeCommentModalContext';

export const nominationFileOutcomeCommentModal = createModal({
  id: 'nominationFileOutcomeCommentModal',
  isOpenedByDefault: false
});

export function NominationFileOutcomeCommentModal(props: {
  formation: FormationEnum;
  onChange: (comment: string | null) => unknown;
  onDrop: () => unknown;
}) {
  const { outcome } = React.useContext(OutcomeCommentModalContext);

  const [hasError, setError] = React.useState(false);
  const [comment, setComment] = React.useState<string | null>(null);
  const [closedByUser, setClosedByUser] = React.useState(true);

  const isCommentRequired = React.useMemo(() => outcome === 'NON_VALIDATED', [outcome]);

  const isCommentValid = (comment?.trim().length ?? 0) > 0;
  const hint =
    props.formation === 'PARQUET'
      ? `Les avis défavorables nécessitent un commentaire`
      : `Les avis non conformes nécessitent un commentaire`;

  useIsModalOpen(nominationFileOutcomeCommentModal, {
    onConceal() {
      if (closedByUser) props.onDrop();

      setError(false);
      setComment(null);
      setClosedByUser(true);
    }
  });

  const onCancelClick = React.useCallback(() => {
    if (isCommentRequired) return;

    props.onChange(null);
    setClosedByUser(false);
    nominationFileOutcomeCommentModal.close();
  }, [props, isCommentRequired]);

  const onConfirmClick = React.useCallback(() => {
    if (isCommentRequired && !isCommentValid) {
      setError(true);
      return;
    }

    props.onChange(comment?.trim() || null);
    setClosedByUser(false);
    nominationFileOutcomeCommentModal.close();
    setComment(null);
  }, [props, comment, isCommentRequired, isCommentValid]);

  return (
    <nominationFileOutcomeCommentModal.Component
      title="Commentaire"
      concealingBackdrop={!isCommentRequired}
      topAnchor
      buttons={[
        {
          doClosesModal: false,
          priority: 'secondary',
          children: 'Sans commentaire',
          onClick: onCancelClick,
          disabled: isCommentRequired,
          title: isCommentRequired ? hint : undefined
        },
        {
          doClosesModal: false,
          priority: 'primary',
          children: 'Sauvegarder',
          onClick: onConfirmClick,
          disabled: isCommentRequired && !isCommentValid
        }
      ]}
    >
      <form>
        <Input
          textArea
          label={
            isCommentRequired ? (
              <>
                commentaire concernant l'issue de ce dossier<span className="text-red-500">*</span>
              </>
            ) : (
              `commentaire concernant l'issue de ce dossier`
            )
          }
          hintText={hasError ? <span className="text-red-600">{hint}</span> : undefined}
          nativeTextAreaProps={{
            value: comment || '',
            required: isCommentRequired,
            onChange: (event) => {
              setComment(event.target.value || null);

              if (hasError) setError(false);
            }
          }}
        />
      </form>
    </nominationFileOutcomeCommentModal.Component>
  );
}
