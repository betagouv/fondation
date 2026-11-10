import Alert from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage, useIntl } from 'react-intl';

function scrollIntoView(element: HTMLDivElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function UploadExcelFailedAlert(props: { validationErrors?: string[] }) {
  const { formatMessage } = useIntl();

  return (
    <Alert
      className="fr-mb-6v"
      closable
      description={
        props.validationErrors ? (
          <ul style={{ listStyleType: '\u00A0-' }}>
            {props.validationErrors.map((error, i) => (
              <li key={`import_error_${i}`}>{error}</li>
            ))}
          </ul>
        ) : (
          <FormattedMessage defaultMessage="Veuillez vérifier le formatage des cellules Excel ou contacter un administrateur." />
        )
      }
      ref={scrollIntoView}
      severity="error"
      title={formatMessage({ defaultMessage: "Échec de l'import" })}
    />
  );
}
