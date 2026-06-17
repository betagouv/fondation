import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Select from '@codegouvfr/react-dsfr/Select';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import React from 'react';
import { useController, useWatch, type UseControllerProps } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

import type { FormationEnum } from '@/types/enums.types';
import { toFullName } from '@/utils/user.utils';
import { useDocsMembersQuery } from '@queries/agenda.queries';

export function AbsentMemberSelector(
  props: UseControllerProps<{ memberIds: string[]; chairmanId: string }, 'memberIds'> & {
    formation: FormationEnum | null;
  },
) {
  const { formatMessage } = useIntl();

  const chairmanId = useWatch({ control: props.control, name: 'chairmanId' });
  const { field, fieldState } = useController(props);

  const { data: membersData, isPending: membersPending } = useDocsMembersQuery({
    formation: props.formation ?? undefined,
  });
  const members = React.useMemo(
    () => new Map((membersData?.items ?? []).map((member) => [member.id, member])),
    [membersData],
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.currentTarget.value;
      if (!members.has(id) || chairmanId === id) return;

      const next = [...new Set(field.value).add(id)];
      field.onChange(next);
    },
    [chairmanId, members, field],
  );

  const unSelect = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.id;
      if (!id) return;

      const next = new Set(field.value);
      next.delete(id);
      field.onChange([...next]);
    },
    [field],
  );

  React.useEffect(() => {
    const selectedIds = new Set(field.value);
    if (selectedIds.has(chairmanId)) {
      selectedIds.delete(chairmanId);
      field.onChange([...selectedIds]);
    }
  }, [chairmanId, field]);

  return (
    <div className="fr-mb-6v">
      <Select
        className="fr-mb-0"
        nativeSelectProps={{ ...field, onChange, value: '' }}
        label={<FormattedMessage defaultMessage="Membres absents" />}
        state={fieldState.error ? 'error' : undefined}
        stateRelatedMessage={fieldState.error?.message}
        disabled={membersPending || !props.formation}
      >
        <option disabled value="">
          <FormattedMessage defaultMessage="Sélectionner les members absents" />
        </option>

        {[...members.values()]
          .filter((member) => !field.value.includes(member.id))
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((member) => (
            <option key={member.id} value={member.id} disabled={chairmanId === member.id}>
              {toFullName(member)}
            </option>
          ))}
      </Select>

      <ul
        className={clsx(
          cx('fr-tags-group--sm', 'fr-tags-group'),
          'flex gap-x-1 transition-opacity duration-150',
          {
            'opacity-0': field.value.length === 0,
            'fr-mt-2v opacity-100': field.value.length > 0,
          },
        )}
      >
        {field.value
          .flatMap((id) => {
            const member = members.get(id);
            return member ? [member] : [];
          })
          .map((member) => (
            <Tag
              dismissible
              title={formatMessage(
                { defaultMessage: 'Retirer {member} des absents' },
                { member: toFullName(member) },
              )}
              key={member.id}
              as="button"
              onClick={unSelect}
              nativeButtonProps={{ 'data-id': member.id }}
            >
              {toFullName(member)}
            </Tag>
          ))}
      </ul>
    </div>
  );
}
