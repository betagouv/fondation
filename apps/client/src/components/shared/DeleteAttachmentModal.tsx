import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';

const modal = createModal({
  id: 'modal-delete-attached-file-transparence',
  isOpenedByDefault: false
});

export type DeleteAttachmentModalProps = {
  fileName: string;
  onDelete: () => void;
};

export const DeleteAttachmentModal = ({ fileName, onDelete }: DeleteAttachmentModalProps) => {
  return (
    <>
      <modal.Component
        title="Confirmer la suppression du fichier"
        buttons={[
          {
            children: 'Annuler'
          },
          {
            children: 'Confirmer',
            nativeButtonProps: {
              onClick: () => {
                onDelete();
              }
            }
          }
        ]}
      >
        <span>
          Confirmez vous la suppression du fichier: <br />
          <em>{fileName}</em>
        </span>
      </modal.Component>
      <Button
        priority="tertiary no outline"
        iconId="fr-icon-delete-bin-fill"
        title={`delete-attached-file-${fileName}`}
        nativeButtonProps={modal.buttonProps}
      />
    </>
  );
};
