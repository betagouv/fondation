import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

import { useConfirmation } from '@/shared/context/confirmation/useConfirmation.hook';

export function DeleteAttachmentModal(props: { fileName: string; onDelete: () => void }) {
  const confirmation = useConfirmation();

  const onDelete = React.useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: 'Confirmer la suppression du fichier',
      content: (
        <p>
          Confirmez-vous la suppression du fichier:{' '}
          <strong>&laquo;&nbsp;{props.fileName}&nbsp;&raquo;</strong>
        </p>
      ),
    });

    if (isConfirmed) props.onDelete();
  }, [props, confirmation]);

  return (
    <Button
      size="small"
      onClick={onDelete}
      className="rounded-full"
      priority="tertiary no outline"
      iconId="fr-icon-delete-bin-fill"
      title={`Supprimer ${props.fileName}`}
      nativeButtonProps={confirmation.buttonProps}
    />
  );
}
