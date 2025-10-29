import Alert from '@codegouvfr/react-dsfr/Alert';
import { type FC } from 'react';

export const UploadExcelFailedAlert: FC<{
  validationError?: string;
}> = ({ validationError }) => (
  <Alert
    className="mx-auto mb-6 max-w-2xl"
    severity="error"
    title="Échec de l'import"
    closable={true}
    description={
      validationError || 'Veuillez vérifier le formattage des cellules excel ou contacter un administrateur.'
    }
  />
);
