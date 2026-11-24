import Alert from '@codegouvfr/react-dsfr/Alert';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CopyButton } from '@/shared/ui/copy-button';

function CopiableValue(props: {
  copiedLabel: ReactNode;
  copyLabel: ReactNode;
  label: string;
  value: string;
}) {
  const inputId = useId();

  return (
    <div className="fr-mb-6v">
      <Input
        className="fr-mb-2v"
        label={props.label}
        nativeInputProps={{ className: 'font-mono', id: inputId, readOnly: true, value: props.value }}
      />
      <CopyButton
        copiedLabel={props.copiedLabel}
        inputId={inputId}
        label={props.copyLabel}
        text={props.value}
      />
    </div>
  );
}

/** Shown once: Fondation keeps only the hash of the secret */
export function ApiClientSecret(props: { clientId: string; secret: string }) {
  const { formatMessage } = useIntl();

  return (
    <>
      <Alert
        className="fr-mb-6v"
        severity="warning"
        small
        description={formatMessage({
          defaultMessage:
            "Ce secret ne s'affichera plus. Transmettez-le au partenaire par un canal sûr avant de fermer cette fenêtre.",
        })}
      />
      <CopiableValue
        copiedLabel={<FormattedMessage defaultMessage="Identifiant copié" />}
        copyLabel={<FormattedMessage defaultMessage="Copier l'identifiant" />}
        label={formatMessage({ defaultMessage: 'Identifiant (client_id)' })}
        value={props.clientId}
      />
      <CopiableValue
        copiedLabel={<FormattedMessage defaultMessage="Secret copié" />}
        copyLabel={<FormattedMessage defaultMessage="Copier le secret" />}
        label={formatMessage({ defaultMessage: 'Secret (client_secret)' })}
        value={props.secret}
      />
    </>
  );
}
