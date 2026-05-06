import { PasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useLogin } from '@queries/auth.queries';

import { AuthenticationFailedAlert } from './AuthenticationFailedAlert';

export const Login = () => {
  const navigate = useNavigate();

  const { isError, isPending, mutateAsync: authenticateAsync } = useLogin();

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
    <div id="login-layout" className="flex h-full items-center justify-center">
      <form onSubmit={authenticateUser} className="w-1/2">
        <div className={cx('fr-mb-6v')}>{isError && !isPending && <AuthenticationFailedAlert />}</div>
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
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
