import Alert from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage } from 'react-intl';
import { useSearchParams } from 'react-router';

import { useListOpenIdProvidersQuery } from '@queries/auth.queries';

import { LoginPasswordForm } from './LoginPasswordForm';
import { LoginProConnectButton } from './LoginProConnectButton';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listProviders = useListOpenIdProvidersQuery();

  const hasError = searchParams.has('error');
  const onAlertClose = () =>
    setSearchParams((prev) => {
      prev.delete('error');
      return new URLSearchParams(prev);
    });

  return (
    <div className="fr-container fr-container--fluid fr-mb-md-14v fr-pt-md-14v">
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-10 fr-col-lg-9 fr-p-5v bg-(--background-alt-grey)">
          <div className="fr-container fr-px-md-0 fr-py-10v fr-py-md-14v">
            <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
              <div className="fr-col-12 fr-col-md-10 fr-col-lg-10">
                <h1>
                  <FormattedMessage defaultMessage="Connexion à Fondation" />
                </h1>

                {hasError && (
                  <Alert
                    className="fr-mb-6v"
                    small
                    onClose={onAlertClose}
                    severity="error"
                    as="h2"
                    closable
                    title={<FormattedMessage defaultMessage="Impossible de vous identifier" />}
                    description={
                      <FormattedMessage defaultMessage="Veuillez réessayer, et en cas de nouvel échec vous connecter avec votre compte" />
                    }
                  />
                )}

                {listProviders.isFetched && (
                  <>
                    <LoginProConnectButton />
                    <LoginPasswordForm />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
