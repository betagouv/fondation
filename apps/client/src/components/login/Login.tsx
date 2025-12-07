import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { PasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { AuthenticationFailedAlert } from './AuthenticationFailedAlert';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { apiFetch } from '../../utils/api-fetch.utils';

const loginUser = async (credentials: { email: string; password: string }) => {
  return apiFetch(`/auth/v2/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
    headers: { 'content-type': 'application/json' }
  });
};

export const Login = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    isError,
    isPending,
    mutateAsync: authenticateAsync
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['introspectSession'] });
      await navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
    }
  });

  const authenticateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    await authenticateAsync({ email, password });
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
            spellCheck: false
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
            spellCheck: false
          }}
        />
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  );
};

export default Login;
