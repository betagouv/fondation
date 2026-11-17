import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export function RetryableLoadFailure(props: {
  isRetrying: boolean;
  onRetry: () => void;
  title: NonNullable<ReactNode>;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Alert
        description={<FormattedMessage defaultMessage="Réessayez et prévenez le support si cela persiste" />}
        severity="error"
        small
        title={props.title}
      />
      <Button
        disabled={props.isRetrying}
        iconId="fr-icon-refresh-line"
        onClick={props.onRetry}
        priority="secondary"
        size="small"
      >
        <FormattedMessage defaultMessage="Réessayer" />
      </Button>
    </div>
  );
}
