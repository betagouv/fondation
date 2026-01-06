import { Badge } from '@codegouvfr/react-dsfr/Badge';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogout, useUser } from '@queries/auth.queries';

import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { AvatarInitials } from './AvatarInitials';

export const Avatar: FC = () => {
  const { user, isError } = useUser();
  const firstLetters = user?.firstLetters as string;

  const navigate = useNavigate();
  const { mutateAsync } = useLogout();

  const onClickLogout = async () => {
    await mutateAsync(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.LOGIN)
    });
  };

  if (!user || isError) {
    return null;
  }

  return (
    <div className="fr-btn flex items-center gap-8">
      <Badge noIcon>{RoleEnumLabels[user.role]}</Badge>
      <div className="flex items-center gap-2">
        <AvatarInitials initials={firstLetters} />
        <div id="avatar-logout" onClick={onClickLogout} className="font-semibold hover:cursor-pointer">
          Se déconnecter
        </div>
      </div>
    </div>
  );
};
