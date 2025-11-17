import Alert from '@codegouvfr/react-dsfr/Alert';
import { type FC } from 'react';

export const UploadExcelFailedAlert: FC<{
  validationErrors?: string[];
}> = ({ validationErrors }) => {
  const setRef = (el: HTMLDivElement | null) => {
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  let description: React.ReactNode | string;
  if (validationErrors) {
    description = (
      <ul style={{ listStyleType: '\u00A0-' }}>
        {validationErrors.map((error, i) => (
          <li key={`import_error_${i}`}>{error}</li>
        ))}
      </ul>
    );
  } else {
    description = 'Veuillez vérifier le formattage des cellules excel ou contacter un administrateur.';
  }

  return (
    <Alert
      ref={setRef}
      className="mx-auto mb-6 max-w-2xl"
      severity="error"
      title="Échec de l'import"
      closable={true}
      description={description}
    />
  );
};
