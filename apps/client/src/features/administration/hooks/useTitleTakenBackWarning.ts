import { useIntl } from 'react-intl';

import { type AdminUserRoleEnum, useTitleHoldersQuery } from '@/queries/administration.queries';

export function useTitleTakenBackWarning(
  role: AdminUserRoleEnum | undefined,
  options: { enabled: boolean; userId?: string },
): string | undefined {
  const { formatMessage } = useIntl();
  const { data: titleHolders } = useTitleHoldersQuery({ enabled: options.enabled });

  const titleHolder = titleHolders?.find((item) => item.role.id === role);
  if (!titleHolder || titleHolder.holder.id === options.userId) return undefined;

  return formatMessage(
    { defaultMessage: '{name} perdra la fonction de {title} et deviendra {nextRole}.' },
    {
      name: titleHolder.holder.name,
      nextRole: titleHolder.holder.nextRole.label,
      title: titleHolder.role.label,
    },
  );
}
