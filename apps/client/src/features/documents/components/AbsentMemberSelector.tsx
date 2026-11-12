import React from 'react';
import { useController, useWatch, type UseControllerProps } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { MemberTagSelect } from '@/shared/components/member-tag-select';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import { memberFullName } from '@/utils/user.utils';
import { useDocsMembersQuery } from '@queries/agenda.queries';

export function AbsentMemberSelector(
  props: UseControllerProps<{ memberIds: string[]; chairmanId: string }, 'memberIds'> & {
    formation: FormationEnum | null;
    includeIds?: readonly string[];
  },
) {
  const { formatMessage } = useIntl();

  const chairmanId = useWatch({ control: props.control, name: 'chairmanId' });
  const { field, fieldState } = useController(props);

  const { data: membersData, isPending: membersPending } = useDocsMembersQuery({
    formation: props.formation ?? undefined,
    includeIds: props.includeIds,
  });
  const members = React.useMemo(
    () => new Map((membersData?.items ?? []).map((member) => [member.id, member])),
    [membersData],
  );

  React.useEffect(() => {
    const selectedIds = new Set(field.value);
    if (selectedIds.has(chairmanId)) {
      selectedIds.delete(chairmanId);
      field.onChange([...selectedIds]);
    }
  }, [chairmanId, field]);

  return (
    <MemberTagSelect
      disabled={membersPending || !props.formation}
      error={fieldState.error?.message}
      label={<FormattedMessage defaultMessage="Membres absents" />}
      nativeSelectProps={{ name: field.name, onBlur: field.onBlur, ref: field.ref }}
      onAdd={(id) => field.onChange([...new Set(field.value).add(id)])}
      onRemove={(id) => field.onChange(field.value.filter((value) => value !== id))}
      options={[...members.values()]
        .filter((member) => !field.value.includes(member.id))
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((member) => ({
          disabled: chairmanId === member.id,
          id: member.id,
          label: memberFullName(member),
        }))}
      placeholder={<FormattedMessage defaultMessage="Sélectionner les members absents" />}
      removeTitle={(member) => formatMessage({ defaultMessage: 'Retirer {member} des absents' }, { member })}
      selected={field.value.flatMap((id) => {
        const member = members.get(id);
        return member ? [{ id, label: memberFullName(member) }] : [];
      })}
    />
  );
}
