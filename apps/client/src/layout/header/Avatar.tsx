import { Badge } from '@codegouvfr/react-dsfr/Badge';
import type { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';

import { RoleEnumMessages } from '@/shared/enums/role.enum';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
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
        {user.isAdmin ? (
          <FormattedMessage defaultMessage="Administrateur" />
        ) : (
          <FormattedMessage {...RoleEnumMessages[user.role]} />
        )}
      </Badge>
      <MenuRoot>
        <MenuTrigger
          className="fr-mb-0 after:ml-1! after:transition-transform data-popup-open:after:rotate-180"
          iconId="fr-icon-arrow-down-s-line"
          iconPosition="right"
          priority="tertiary no outline"
        >
          <span
            aria-hidden
            className="mr-2 inline-flex size-8 items-center justify-center rounded-full bg-(--background-default-grey-active) text-sm font-medium text-(--text-default-grey)"
          >
            {toInitials(user)}
          </span>
          {memberFullName(user)}
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            className="px-4! py-3!"
            iconId="fr-icon-account-circle-line"
            linkProps={{ to: ROUTE_PATHS.ACCOUNT }}
            size="small"
          >
            <FormattedMessage defaultMessage="Mon compte" />
          </MenuItem>
          <MenuItem
            className="px-4! py-3!"
            iconId="fr-icon-logout-box-r-line"
            onClick={onClickLogout}
            size="small"
          >
            <FormattedMessage defaultMessage="Se déconnecter" />
          </MenuItem>
        </MenuContent>
      </MenuRoot>
    </>
  );
};
