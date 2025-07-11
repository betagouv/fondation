import Alert from '@codegouvfr/react-dsfr/Alert';
import { type FC } from 'react';

export const ImportObservantsExcelValidationAlert: FC = () => (
  <Alert
    severity="error"
    title="Échec de l'import"
    description={
      'Veuillez vérifier le formattage des cellules excel ou contacter un administrateur.'
    }
  />
);
