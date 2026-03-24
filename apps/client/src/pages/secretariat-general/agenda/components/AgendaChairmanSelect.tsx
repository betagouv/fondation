import Select from '@codegouvfr/react-dsfr/Select';

import { useSearchChairmenQuery } from '@queries/agenda.queries';
import React from 'react';
import { useNewAgenda } from '../context/NewAgendaContext';

export function AgendaChairmanSelect(props: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const { session } = useNewAgenda();

  const { data, isPending } = useSearchChairmenQuery({ formation: session.formation });
  const chairmen = data?.items ?? [];

  React.useEffect(() => {
    if (data && data.items.length > 0 && !props.value) {
      const president = data.items.find((p) =>
        session.formation === 'PARQUET' ? p.title === 'PRESIDENT_PARQUET' : p.title === 'PRESIDENT_SIEGE'
      );

      if (president) props.onChange(president.id);
    }
  }, [session, data, props]);

  return (
    <Select
      label={
        <>
          Président de séance<span className="text-red-600">*</span>
        </>
      }
      nativeSelectProps={{
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
        disabled: isPending
      }}
      state={props.error ? 'error' : 'default'}
      stateRelatedMessage={props.error}
    >
      <option value="" disabled>
        Sélectionner un président
      </option>
      {chairmen.map((c) => (
        <option key={c.id} value={c.id}>
          {[c.displayTitle, c.lastName.toUpperCase()].join(' ')}
        </option>
      ))}
    </Select>
  );
}
