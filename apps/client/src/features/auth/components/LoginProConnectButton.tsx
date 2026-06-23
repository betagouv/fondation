import { ProConnectButton } from '@codegouvfr/react-dsfr/ProConnectButton';
import { FormattedMessage } from 'react-intl';

import { useListOpenIdProvidersQuery, usePrepareOpenIdLoginMutation } from '@queries/auth.queries';

export function LoginProConnectButton() {
  const openIdProvidersList = useListOpenIdProvidersQuery();
  const prepareLoginMutation = usePrepareOpenIdLoginMutation({ provider: 'pro-connect' });

  const hasProConnect = (openIdProvidersList.data?.items ?? []).includes('pro-connect');

  const onPrepare = () => {
    prepareLoginMutation.mutate(undefined, {
      onSuccess({ data }) {
        const $a = document.createElement('a');
        $a.href = data!.url;
        $a.click();
      },
    });
  };

  if (!hasProConnect) return null;

  return (
    <div className="fr-mb-6v">
      <h2>
        <FormattedMessage defaultMessage="Se connecter avec ProConnect" />
      </h2>
      <ProConnectButton onClick={onPrepare} />
      <p className="fr-hr-or">
        <FormattedMessage defaultMessage="ou" />
      </p>
    </div>
  );
}
