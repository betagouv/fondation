import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { type FC } from 'react';
import { ObservationForm } from './ObservationForm';

export const createObservationModal = createModal({
  id: 'modal-create-observation',
  isOpenedByDefault: false
});

export const CreateObservationModal: FC<{
  nominationFileId: string;
  nominationFileName: string;
  onSuccess?: () => void;
}> = ({ nominationFileId, nominationFileName, onSuccess }) => {
  const handleSuccess = () => {
    createObservationModal.close();
    onSuccess?.();
  };

  return (
    <createObservationModal.Component
      title={`Nouvelle observation - ${nominationFileName}`}
      buttons={[
        {
          doClosesModal: true,
          priority: 'secondary',
          children: 'Annuler'
        },
        {
          doClosesModal: false,
          priority: 'primary',
          children: 'Créer',
          nativeButtonProps: {
            type: 'submit',
            form: 'observation-form'
          }
        }
      ]}
    >
      <ObservationForm
        nominationFileId={nominationFileId}
        nominationFileName={nominationFileName}
        onSuccess={handleSuccess}
      />
    </createObservationModal.Component>
  );
};
