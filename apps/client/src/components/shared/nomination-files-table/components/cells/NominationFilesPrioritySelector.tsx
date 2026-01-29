import React from 'react';

import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { DropdownSelect } from '../../../DropdownSelect';
import { useAffectationRow } from '../../contexts/files-affectations.context';

const EMPTY_VALUE = '__EMPTY__' as const;
const PRIORITY_SELECTOR_OPTIONS = [
  { value: EMPTY_VALUE, label: 'Aucune' },
  ...Object.values(PrioriteEnum).map((priorite) => ({
    value: priorite,
    label: PrioriteEnumLabels[priorite]
  }))
];

export function NominationFilesPrioritySelector(props: { fileId: string }) {
  const { priority, prioritize } = useAffectationRow(props.fileId);
  const selectedPriority = React.useMemo(() => priority ?? EMPTY_VALUE, [priority]);

  const handleChange = React.useCallback(
    (value: string) => prioritize(value === EMPTY_VALUE ? null : (value as PrioriteEnum)),
    [prioritize]
  );

  return (
    <DropdownSelect
      options={PRIORITY_SELECTOR_OPTIONS}
      value={selectedPriority ?? EMPTY_VALUE}
      onChange={handleChange}
      placeholder="Sélectionner"
    />
  );
}
