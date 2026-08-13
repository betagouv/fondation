import { Badge } from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import type { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import { RoleEnumLabels } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { memberFullName, toInitials } from '@/utils/user.utils';
import { useLogout, useUser } from '@queries/auth.queries';

export const Avatar: FC = () => {
  const { user, isError } = useUser();

  const navigate = useNavigate();
  const { mutateAsync } = useLogout();

  const onClickLogout = async () => {
    await mutateAsync(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.LOGIN),
    });
  };

  if (!user || isError) {
    return null;
  }

  return (
    <>
      <Badge className="fr-mx-2v fr-mt-0 fr-ml-3v self-center" noIcon small>
        {RoleEnumLabels[user.role]}
      </Badge>
      <Button className="fr-mb-0" onClick={onClickLogout}>
        <div className="fr-py-2v flex items-center gap-8 rounded-sm">
          <div className="flex items-center gap-2">
            <Tooltip label={memberFullName(user)}>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-(--background-default-grey-active) text-sm font-medium text-(--text-default-grey)">
                {toInitials(user)}
              </span>
            </Tooltip>
            <div className="font-semibold hover:cursor-pointer" id="avatar-logout">
              <FormattedMessage defaultMessage="Se déconnecter" />
            </div>
          </div>
        </div>
      </Button>
    </>
  );
};
