import { toFullName } from '@/utils/user.utils';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Select from '@codegouvfr/react-dsfr/Select';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import { useListMembersForNewOfficialReportQuery } from '@queries/agenda.queries';
import clsx from 'clsx';
import React from 'react';
import { useController, type UseControllerProps } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

export function AbsentMemberSelector(
  props: UseControllerProps<{ memberIds: string[] }, 'memberIds'> & {
    sessionId: string;
    chairmanId: string;
  },
) {
  const { formatMessage } = useIntl();
  const { field, fieldState } = useController(props);
  const [selectedIds, setSelectedIds] = React.useState(new Set<string>());

  const { data: membersData } = useListMembersForNewOfficialReportQuery({ sessionId: props.sessionId });
  const members = React.useMemo(
    () => new Map((membersData?.items ?? []).map((member) => [member.id, member])),
    [membersData],
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.currentTarget.value;
      if (!members.has(id) || props.chairmanId === id) return;

      setSelectedIds((selected) => {
        const next = new Set(selected.add(id));
        field.onChange([...next]);
        return next;
      });
    },
    [props.chairmanId, members, field, setSelectedIds],
  );

  const unSelect = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.id;
      if (!id) return;

      setSelectedIds((selected) => {
        selected.delete(id);
        field.onChange([...selected]);
        return new Set(selected);
      });
    },
    [field],
  );

  React.useEffect(() => {
    if (selectedIds.has(props.chairmanId)) {
      setSelectedIds((selected) => {
        selected.delete(props.chairmanId);
        return new Set(selected);
      });
    }
  }, [props.chairmanId, selectedIds, setSelectedIds]);

  return (
    <div className="mb-6">
      <Select
        className="mb-0"
        nativeSelectProps={{ ...field, onChange, value: '' }}
        label={<FormattedMessage defaultMessage="Membres absents" />}
        state={fieldState.error ? 'error' : undefined}
        stateRelatedMessage={fieldState.error?.message}
      >
        <option disabled value="">
          <FormattedMessage defaultMessage="Sélectionner les members absents" />
        </option>

        {[...members.values()]
          .filter((member) => !selectedIds.has(member.id))
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((member) => (
            <option key={member.id} value={member.id} disabled={props.chairmanId === member.id}>
              {toFullName(member)}
            </option>
          ))}
      </Select>

      <ul
        className={clsx(
          cx('fr-tags-group--sm', 'fr-tags-group'),
          'flex gap-x-1 transition-opacity duration-150',
          {
            'opacity-0': selectedIds.size === 0,
            'opacity-100 mt-2': selectedIds.size > 0,
          },
        )}
      >
        {[...selectedIds]
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
