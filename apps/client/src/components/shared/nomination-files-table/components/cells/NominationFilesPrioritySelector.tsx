import React from 'react';

import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { DropdownSelect } from '../../../DropdownSelect';
import { NO_PRIORITY, useAffectationRow } from '../../contexts/files-affectations.context';

const PRIORITY_SELECTOR_OPTIONS = [
  { value: NO_PRIORITY, label: 'Aucune' },
  ...Object.values(PrioriteEnum).map((priorite) => ({
    value: priorite,
    label: PrioriteEnumLabels[priorite]
  }))
];

export function NominationFilesPrioritySelector(props: { fileId: string }) {
  const { priority, prioritize } = useAffectationRow(props.fileId);
  const selectedPriority = React.useMemo(() => priority ?? NO_PRIORITY, [priority]);

  const handleChange = React.useCallback(
    (value: string) => {
      prioritize(value === NO_PRIORITY ? NO_PRIORITY : (value as PrioriteEnum));
    },
    [prioritize]
  );

  return (
    <DropdownSelect
      options={PRIORITY_SELECTOR_OPTIONS}
      value={selectedPriority ?? NO_PRIORITY}
      onChange={handleChange}
      placeholder="Sélectionner"
    />
  );
}
