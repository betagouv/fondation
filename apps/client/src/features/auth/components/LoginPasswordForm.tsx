import PasswordInput from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Input from '@codegouvfr/react-dsfr/Input';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { usePasswordLogin } from '@queries/auth.queries';

import { AuthenticationFailedAlert } from './AuthenticationFailedAlert';

export function LoginPasswordForm() {
  const navigate = useNavigate();
  const { isError, isPending, mutateAsync: authenticateAsync } = usePasswordLogin();

  const authenticateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    await authenticateAsync(
      { email, password },
      { onSuccess: () => navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD) },
    );
  };

  return (
    <form onSubmit={authenticateUser}>
      <fieldset
        className="fr-fieldset"
        id="login-fieldset-5a03b9eb"
        aria-labelledby="login-fieldset-5a03b9eb-legend"
      >
        <legend className="fr-fieldset__legend" id="login-fieldset-5a03b9eb-legend">
          <h2>
            <FormattedMessage defaultMessage="Se connecter avec son compte" />
          </h2>
        </legend>

        <div className={cx('fr-mb-6v')}>{isError && !isPending && <AuthenticationFailedAlert />}</div>

        <div className="fr-fieldset__element">
          <Input
            label="Email"
            id="email"
            nativeInputProps={{
              name: 'email',
              type: 'email',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              autoComplete: 'email',
              spellCheck: false,
            }}
          />
        </div>
        <div className="fr-fieldset__element">
          <PasswordInput
            label="Mot de passe"
            nativeInputProps={{
              id: 'password',
              name: 'password',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              autoComplete: 'current-password',
              spellCheck: false,
            }}
          />
        </div>
        <div className="fr-fieldset__element">
          <ButtonsGroup
            buttons={[{ type: 'submit', children: <FormattedMessage defaultMessage="Se connecter" /> }]}
          />
        </div>
      </fieldset>
    </form>
  );
}
