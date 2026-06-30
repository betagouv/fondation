import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { FormationEnum } from '@/types/enums.types';

import { OutcomeCommentModalContext } from './OutcomeCommentModalContext';

export const nominationFileOutcomeCommentModal = createModal({
  id: 'nominationFileOutcomeCommentModal',
  isOpenedByDefault: false,
});

export function NominationFileOutcomeCommentModal(props: {
  formation: FormationEnum;
  onChange: (comment: string | null) => unknown;
  onDrop: () => unknown;
}) {
  const { formatMessage } = useIntl();
  const { outcome, initialComment } = useContext(OutcomeCommentModalContext);

  const [hasError, setError] = useState(false);
  const [comment, setComment] = useState<string | null>(null);
  const [closedByUser, setClosedByUser] = useState(true);

  const isCommentRequired = useMemo(() => outcome === 'NON_VALIDATED', [outcome]);

  const isCommentValid = (comment?.trim().length ?? 0) > 0;
  const isUnchanged = (comment?.trim() || null) === initialComment;
  const hint =
    props.formation === 'PARQUET'
      ? formatMessage({ defaultMessage: 'Les avis défavorables nécessitent un commentaire' })
      : formatMessage({ defaultMessage: 'Les avis non conformes nécessitent un commentaire' });

  const isOpen = useIsModalOpen(nominationFileOutcomeCommentModal, {
    onConceal() {
      if (closedByUser) props.onDrop();

      setError(false);
      setComment(null);
      setClosedByUser(true);
    },
  });

  useEffect(() => {
    if (isOpen) setComment(initialComment);
  }, [isOpen, initialComment]);

  const onCancelClick = useCallback(() => {
    if (isCommentRequired) return;

    props.onChange(null);
    setClosedByUser(false);
    nominationFileOutcomeCommentModal.close();
  }, [props, isCommentRequired]);

  const onConfirmClick = useCallback(() => {
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
      buttons={[
        {
          children: <FormattedMessage defaultMessage="Sans commentaire" />,
          disabled: isCommentRequired,
          doClosesModal: false,
          onClick: onCancelClick,
          priority: 'secondary',
          title: isCommentRequired ? hint : undefined,
        },
        {
          children: <FormattedMessage defaultMessage="Sauvegarder" />,
          disabled: isUnchanged || (isCommentRequired && !isCommentValid),
          doClosesModal: false,
          onClick: onConfirmClick,
          priority: 'primary',
        },
      ]}
      concealingBackdrop={!isCommentRequired}
      title={<FormattedMessage defaultMessage="Commentaire" />}
      topAnchor
    >
      <form>
        <Input
          hintText={hasError ? <span className="text-(--text-default-error)">{hint}</span> : undefined}
          label={
            <>
              <FormattedMessage defaultMessage="Commentaire concernant l'issue de ce dossier" />
              {isCommentRequired && <span className="text-(--text-default-error)">*</span>}
            </>
          }
          nativeTextAreaProps={{
            onChange: (event) => {
              setComment(event.target.value || null);

              if (hasError) setError(false);
            },
            required: isCommentRequired,
            value: comment || '',
          }}
          textArea
        />
      </form>
    </nominationFileOutcomeCommentModal.Component>
  );
}
