import { useIntl } from 'react-intl';

import { AdminUserRoleLabel, type AdminUserRoleEnum } from '../labels/admin-user-enum';
import { useTitleHoldersQuery } from '@/queries/administration.queries';

/** giving a title takes it back from its holder, who keeps the role the API tells */
export function useTitleTakenBackWarning(
  role: AdminUserRoleEnum | undefined,
  options: { enabled: boolean; userId?: string },
): string | undefined {
  const { formatMessage } = useIntl();
  const { data: titleHolders } = useTitleHoldersQuery({ enabled: options.enabled });

  const holder = titleHolders?.find((titleHolder) => titleHolder.role === role)?.holder;
  if (!role || !holder || holder.id === options.userId) return undefined;

  return formatMessage(
    { defaultMessage: '{name} perdra la fonction de {title} et deviendra {nextRole}.' },
    {
      name: holder.name,
      nextRole: formatMessage(AdminUserRoleLabel[holder.nextRole], { gender: holder.gender }),
      title: formatMessage(AdminUserRoleLabel[role], { gender: holder.gender }),
    },
  );
}
