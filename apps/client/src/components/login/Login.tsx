import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { AuthenticationFailedAlert } from './AuthenticationFailedAlert';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../utils/api-fetch.utils';
import { useNavigate } from 'react-router-dom';
import type { IdentityAndAccessRestContract } from 'shared-models';
import { ROUTE_PATHS } from '../../utils/route-path.utils';

const loginUser = async (credentials: { email: string; password: string }) => {
  const {
    method,
    path
  }: Partial<IdentityAndAccessRestContract['endpoints']['login']> = {
    method: 'POST',
    path: 'login'
  };
  return apiFetch(`/auth/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
};

export const Login = () => {
  const navigate = useNavigate();

  const {
    mutateAsync: authenticateAsync,
    isError,
    isPending
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
    }
  });

  const authenticateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)
      .value;

    await authenticateAsync({ email, password });
  };

  return (
    <div id="login-layout" className="flex h-full items-center justify-center">
      <form onSubmit={authenticateUser} className="w-1/2">
        <div className={cx('fr-mb-6v')}>
          {isError && !isPending && <AuthenticationFailedAlert />}
        </div>
        <Input
          label="Email"
          id="email"
          nativeInputProps={{
            name: 'email',
            type: 'email',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            autoComplete: 'email',
            spellCheck: false
          }}
        />
        <Input
          label="Mot de passe"
          id="password"
          nativeInputProps={{
            name: 'password',
            type: 'password',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            autoComplete: 'current-password',
            spellCheck: false
          }}
        />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
