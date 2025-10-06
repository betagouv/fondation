import { colors } from '@codegouvfr/react-dsfr';
import { useMutation } from '@tanstack/react-query';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleLabels, type IdentityAndAccessRestContract } from 'shared-models';
import { useValidateSessionFromCookie } from '../../react-query/queries/validate-session-from-cookie.query';
import { apiFetch } from '../../utils/api-fetch.utils';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { Badge } from '@codegouvfr/react-dsfr/Badge';

const logoutUser = async () => {
  const { method, path }: Partial<IdentityAndAccessRestContract['endpoints']['logout']> = {
    method: 'POST',
    path: 'logout'
  };
  await apiFetch(`/auth/${path}`, {
    method
  });
};

export const Avatar: FC = () => {
  const { user, isError, invalidateSession } = useValidateSessionFromCookie();
  const firstLetters = user?.firstLetters;

  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // D'abord invalider le cache, puis rediriger
      invalidateSession();
      navigate(ROUTE_PATHS.LOGIN);
    }
  });

  const onClickLogout = async () => {
    await mutateAsync();
  };

  if (!user || isError) {
    return null;
  }

  return (
    <div className="fr-btn flex items-center gap-8">
      <Badge noIcon>{RoleLabels[user.role]}</Badge>
      <div className="flex items-center gap-2">
        <div
          id={`avatar-${firstLetters}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
          style={{
            backgroundColor: colors.decisions.text.title.blueFrance.default
          }}
          title={firstLetters}
        >
          {firstLetters}
        </div>
        <div id="avatar-logout" onClick={onClickLogout} className="font-semibold hover:cursor-pointer">
          Se déconnecter
        </div>
      </div>
    </div>
  );
};
