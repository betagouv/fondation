import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import type { RemarkStatusEnum } from '@/shared/enums/remark-status.enum';
import { Modal } from '@/shared/ui/modal';

import { RemarkStatusBadge } from './RemarkStatusBadge';

export function RemarkStatusCommentModal(props: {
  comment: string | null;
  onClosed: () => void;
  onComment: (comment: string | null) => void;
  onDrop: () => void;
  open: boolean;
  status: RemarkStatusEnum;
}) {
  const [comment, setComment] = useState(props.comment ?? '');

  return (
    <Modal
      actions={
        <>
          <Button onClick={props.onDrop} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button onClick={() => props.onComment(comment.trim() || null)}>
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      onClose={props.onDrop}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Statut de la remarque" />}
    >
      <p className="fr-mb-4v flex items-center gap-2">
        <FormattedMessage defaultMessage="Statut :" />
        <RemarkStatusBadge status={props.status} />
      </p>
      <Input
        hintText={
          <FormattedMessage defaultMessage="Facultatif. Par exemple la raison ou le ticket qui la traite." />
        }
        label={<FormattedMessage defaultMessage="Commentaire" />}
        nativeTextAreaProps={{
          maxLength: 2_000,
          onChange: (event) => setComment(event.target.value),
          rows: 3,
          value: comment,
        }}
        textArea
      />
    </Modal>
  );
}
