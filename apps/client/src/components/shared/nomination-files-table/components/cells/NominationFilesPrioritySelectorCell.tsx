import React from 'react';

import { DropdownSelectMultiple } from '@/components/shared/DropdownSelectMultiple';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { useAffectationRow } from '../../contexts/files-affectations.context';

const PRIORITY_SELECTOR_ITEMS = Object.values(PrioriteEnum);

function labelizePriority(value: PrioriteEnum | readonly PrioriteEnum[]): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Aucune';

    return value.map((x) => labelizePriority(x)).join(', ');
  }

  return PrioriteEnumLabels[value as PrioriteEnum];
}

export function NominationFilesPrioritySelectorCell(props: { fileId: string }) {
  const { priorities, prioritize } = useAffectationRow(props.fileId);

  const selected = React.useMemo(() => priorities ?? [], [priorities]);
  const setSelected = React.useCallback(
    (selected: readonly PrioriteEnum[]) => prioritize(new Set(selected)),
    [prioritize]
  );

  const selectedLabel = labelizePriority(selected);

  return (
    <DropdownSelectMultiple
      items={PRIORITY_SELECTOR_ITEMS}
      renderItem={(item) => <span className="text-sm">{labelizePriority(item)}</span>}
      value={selected}
      onChange={setSelected}
      buttonProps={{ size: 'small', priority: 'tertiary no outline' }}
      title="Sélectionner les priorités"
    >
      {selectedLabel}
    </DropdownSelectMultiple>
  );
}
