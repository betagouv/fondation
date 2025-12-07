import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleLabels, type IdentityAndAccessRestContract } from 'shared-models';
import { useUser } from '../../react-query/queries/use-user.queries';
import { apiFetch } from '../../utils/api-fetch.utils';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { AvatarInitials } from './AvatarInitials';

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
  const queryClient = useQueryClient();
  const { user, isError } = useUser();
  const firstLetters = user?.firstLetters as string;

  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['introspectSession'] });
      await navigate(ROUTE_PATHS.LOGIN);
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
        <AvatarInitials initials={firstLetters} />
        <div id="avatar-logout" onClick={onClickLogout} className="font-semibold hover:cursor-pointer">
          Se déconnecter
        </div>
      </div>
    </div>
  );
};
