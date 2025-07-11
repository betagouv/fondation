import Alert from '@codegouvfr/react-dsfr/Alert';
import { type FC } from 'react';

export const UploadExcelFailedAlert: FC<{
  validationError?: string;
}> = ({ validationError }) => (
  <Alert
    severity="error"
    title="Échec de l'import"
    description={
      validationError ||
      'Veuillez vérifier le formattage des cellules excel ou contacter un administrateur.'
    }
  />
);
