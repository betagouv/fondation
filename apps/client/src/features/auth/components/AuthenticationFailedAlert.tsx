import Alert from '@codegouvfr/react-dsfr/Alert';

export function AuthenticationFailedAlert() {
  return (
    <Alert
      description="Veuillez vous reconnecter avec un autre couple identifiant/mot de passe, ou vous adresser au secrétariat général si le problème persiste."
      severity="error"
      title="Échec de la connexion"
    />
  );
}
