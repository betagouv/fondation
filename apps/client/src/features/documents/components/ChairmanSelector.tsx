import Select from '@codegouvfr/react-dsfr/Select';
import React from 'react';
import { useController, type UseControllerProps } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { RequiredLabel } from '@/shared/ui/required-label';
import type { FormationEnum } from '@/types/enums.types';
import { memberFullName } from '@/utils/user.utils';
import type { FoundDocsMembersDto } from '@api/types';
import { useDocsMembersQuery } from '@queries/agenda.queries';

export function ChairmanSelector(
  props: UseControllerProps<{ chairmanId: string }, 'chairmanId'> & { formation: FormationEnum | undefined },
) {
  const { formatMessage } = useIntl();
  const { field, fieldState } = useController(props);

  const { data: membersData, isFetching: isMembersFetching } = useDocsMembersQuery({
    formation: props.formation,
  });

  const [chairmen, nonChairmen] = React.useMemo(
    () =>
      (membersData?.items ?? [])
        .toSorted((a, b) => a.lastName.localeCompare(b.lastName))
        .reduce(
          ([left, right], m) => {
            if (m.duty === 'PRESIDENT' || m.duty === 'DEPUTY_PRESIDENT') {
              left.push(m);
            } else {
              right.push(m);
            }
            return [left, right] as const;
          },
          [[], []] as [FoundDocsMembersDto['items'][number][], FoundDocsMembersDto['items'][number][]],
        ),
    [membersData],
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value;
      field.onChange(value || null);
    },
    [field],
  );

  React.useEffect(() => {
    if (chairmen.length > 0 && !fieldState.isDirty && !field.value) {
      const president = chairmen.find((c) =>
        props.formation === 'PARQUET' ? c.title === 'PRESIDENT_PARQUET' : c.title === 'PRESIDENT_SIEGE',
      );
      if (president) field.onChange(president.id);
    }
  }, [props.formation, chairmen, field, fieldState]);

  return (
    <>
      <Select
        label={
          <RequiredLabel>
            <FormattedMessage defaultMessage={`Président de séance`} />
          </RequiredLabel>
        }
        disabled={isMembersFetching || field.disabled}
        nativeSelectProps={{
          onChange,
          value: field.value,
        }}
        state={fieldState.error ? 'error' : 'default'}
        stateRelatedMessage={fieldState.error?.message}
      >
        {chairmen.length > 0 && (
          <optgroup label={formatMessage({ defaultMessage: 'Président ou suppléant' })}>
            {chairmen.map((c) => (
              <option key={c.id} value={c.id}>
                {memberFullName(c)}
              </option>
            ))}
          </optgroup>
        )}

        {nonChairmen.length > 0 && (
          <optgroup label={formatMessage({ defaultMessage: `Membres` })}>
            {nonChairmen.map((m) => (
              <option key={m.id} value={m.id}>
                {memberFullName(m)}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
    </>
  );
}
