import Alert from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage, useIntl } from 'react-intl';

export function AuthenticationFailedAlert() {
  const { formatMessage } = useIntl();

  return (
    <>
      <Alert
        description={
          <FormattedMessage defaultMessage="Veuillez vous reconnecter avec un autre couple identifiant/mot de passe, ou vous adresser au secrétariat général si le problème persiste." />
        }
        severity="error"
        title={formatMessage({ defaultMessage: 'Échec de la connexion' })}
      />
      <p className="fr-mt-2v fr-text--sm">
        <FormattedMessage defaultMessage="Après plusieurs essais infructueux, la connexion est suspendue pendant 15 minutes." />
      </p>
    </>
  );
}
