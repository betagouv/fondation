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
        title="Suppression de la pièce jointe"
        buttons={[
          {
            children: 'Annuler'
          },
          {
            children: 'Supprimer',
            nativeButtonProps: {
              onClick: () => {
                onDelete();
              }
            }
          }
        ]}
      >
        <span>
          Voulez-vous vraiment supprimer la pièce jointe: <br />
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
