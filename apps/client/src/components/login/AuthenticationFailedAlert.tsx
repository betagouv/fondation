import Alert from "@codegouvfr/react-dsfr/Alert";
import { FC } from "react";

export const AuthenticationFailedAlert: FC = () => (
  <Alert
    severity="error"
    title="Échec de la connexion"
    description="Veuillez vous reconnecter avec un autre couple identifiant/mot de passe, ou vous adresser au secrétariat général si le problème persiste."
  />
);
