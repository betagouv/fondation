import { colors } from '@codegouvfr/react-dsfr';
import type { FC } from 'react';
import { apiFetch } from '../../utils/api-fetch.utils';
import type { IdentityAndAccessRestContract } from 'shared-models';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../utils/route-path.utils';

const logoutUser = async () => {
  const {
    method,
    path
  }: Partial<IdentityAndAccessRestContract['endpoints']['logout']> = {
    method: 'POST',
    path: 'logout'
  };
  await apiFetch(`/auth/${path}`, {
    method
  });
};

export const AppHeaderAvatar: FC = () => {
  const firstLetters = 'AB';

  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      navigate(ROUTE_PATHS.LOGIN);
    }
  });

  const onClickLogout = async () => {
    await mutateAsync();
  };

  return (
    <div className="fr-btn flex items-center gap-2">
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
      <div
        id="avatar-logout"
        onClick={onClickLogout}
        className="font-semibold hover:cursor-pointer"
      >
        Se déconnecter
      </div>
    </div>
  );
};
