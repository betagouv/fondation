import Select from '@codegouvfr/react-dsfr/Select';

import { useAgenda } from '../context/AgendaContext';
import { toFullName } from '@/utils/user.utils';
import { useDocsMembersQuery } from '@queries/agenda.queries';

export function AgendaChairmanSelect(props: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const { session } = useAgenda();

  const { data: chairmen = [], isPending } = useDocsMembersQuery({
    formation: session.formation,
    select: (data) =>
      (data?.items ?? []).filter((m) => m.duty === 'DEPUTY_PRESIDENT' || m.duty === 'PRESIDENT'),
  });

  return (
    <Select
      label={
        <>
          Président de séance<span className="text-(--text-default-error)">*</span>
        </>
      }
      nativeSelectProps={{
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        disabled: isPending,
      }}
      state={props.error ? 'error' : 'default'}
      stateRelatedMessage={props.error}
    >
      <option value="" disabled>
        Sélectionner un président
      </option>
      {chairmen.map((c) => (
        <option key={c.id} value={c.id}>
          {toFullName(c)}
        </option>
      ))}
    </Select>
  );
}
