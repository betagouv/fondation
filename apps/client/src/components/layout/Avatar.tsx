import { Badge } from '@codegouvfr/react-dsfr/Badge';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogout, useUser } from '@queries/auth.queries';

import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { AvatarInitials } from './AvatarInitials';
import Button from '@codegouvfr/react-dsfr/Button';

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
    <>
      <Badge small noIcon className="mx-2 mb-4 mt-0 self-center">
        {RoleEnumLabels[user.role]}
      </Badge>
      <Button className="mb-0!">
        <div className="flex items-center gap-8 rounded py-2">
          <div className="flex items-center gap-2">
            <AvatarInitials initials={firstLetters} />
            <div id="avatar-logout" onClick={onClickLogout} className="font-semibold hover:cursor-pointer">
              Se déconnecter
            </div>
          </div>
        </div>
      </Button>
    </>
  );
};
