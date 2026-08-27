import Select from '@codegouvfr/react-dsfr/Select';
import { FormattedMessage, useIntl } from 'react-intl';

import { useAgenda } from '@/features/documents/context/AgendaContext';
import { RequiredLabel } from '@/shared/ui/required-label';
import { memberFullName } from '@/utils/user.utils';
import { useDocsMembersQuery } from '@queries/agenda.queries';

export function AgendaChairmanSelect(props: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const { formatMessage } = useIntl();
  const { session } = useAgenda();

  const { data: chairmen = [], isPending } = useDocsMembersQuery({
    formation: session.formation,
    select: (data) =>
      (data?.items ?? []).filter((m) => m.duty === 'DEPUTY_PRESIDENT' || m.duty === 'PRESIDENT'),
  });

  return (
    <Select
      label={
        <RequiredLabel>
          <FormattedMessage defaultMessage="Président de séance" />
        </RequiredLabel>
      }
      nativeSelectProps={{
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        disabled: isPending,
      }}
      state={props.error ? 'error' : 'default'}
      stateRelatedMessage={props.error}
    >
      <option disabled value="">
        {formatMessage({ defaultMessage: 'Sélectionner un président' })}
      </option>
      {chairmen.map((c) => (
        <option key={c.id} value={c.id}>
          {memberFullName(c)}
        </option>
      ))}
    </Select>
  );
}
