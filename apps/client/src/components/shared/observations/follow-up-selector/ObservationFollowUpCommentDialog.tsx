import type { ObservationFollowupEnum } from '@/types/enums.types';
import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import React, { type FormEvent } from 'react';

export const observationFollowUpModal = createModal({
  isOpenedByDefault: false,
  id: `observation-follow-up-comment-modal`
});

export function ObservationFollowUpCommentModal(props: {
  followUp: ObservationFollowupEnum | null;
  onChange: (value: string | null) => unknown;
  onDrop: () => unknown;
}) {
  const [willDrop, setWillDrop] = React.useState<boolean>(true);
  const [comment, setComment] = React.useState<string | null>(null);

  const isCommentRequired = React.useMemo(() => props.followUp === 'INTERESTING', [props.followUp]);
  const hint = `Commentaire obligatoire`;

  const error = React.useMemo(() => {
    if (isCommentRequired && comment !== null && !comment.trim()) return hint;
    return null;
  }, [isCommentRequired, comment, hint]);

  const preventSubmit = React.useCallback((e: FormEvent) => e.preventDefault(), []);

  const onConceal = React.useCallback(() => {
    if (willDrop) props.onDrop();

    setComment(null);
    setWillDrop(true);
  }, [props, willDrop, setComment, setWillDrop]);

  useIsModalOpen(observationFollowUpModal, { onConceal });

  const onCancel = React.useCallback(() => {
    if (isCommentRequired) return;

    setWillDrop(false);
    observationFollowUpModal.close();
  }, [setWillDrop, isCommentRequired]);

  const onSave = React.useCallback(() => {
    if (isCommentRequired && !comment?.trim()) return;

    if (comment) props.onChange(comment.trim());

    setWillDrop(false);
    observationFollowUpModal.close();
  }, [comment, isCommentRequired, props]);

  return (
    <observationFollowUpModal.Component
      title="Commentaire"
      concealingBackdrop
      buttons={[
        {
          children: 'Sans commentaire',
          priority: 'secondary',
          onClick: onCancel,
          disabled: isCommentRequired,
          title: isCommentRequired ? hint : undefined
        },
        {
          children: 'Sauvegarder',
          priority: 'primary',
          onClick: onSave,
          disabled: isCommentRequired && !comment?.trim(),
          title: isCommentRequired && !comment?.trim() ? hint : undefined
        }
      ]}
    >
      <form onSubmit={preventSubmit}>
        <Input
          textArea
          label={
            isCommentRequired ? (
              <>
                commentaire <span className="text-red-500">*</span>
              </>
            ) : (
              'commentaire'
            )
          }
          hintText={error ? <span className="text-red-500">{error}</span> : null}
          nativeTextAreaProps={{
            name: 'observation_follow_up_comment',
            value: comment || '',
            required: isCommentRequired,
            onChange(event) {
              setComment(event.target.value);
            }
          }}
        />
      </form>
    </observationFollowUpModal.Component>
  );
}
