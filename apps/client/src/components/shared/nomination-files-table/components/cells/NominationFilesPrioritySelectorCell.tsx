import React from 'react';

import { DropdownSelectMultiple } from '@/components/shared/DropdownSelectMultiple';
import { PriorityBadge, PriorityBadgeList } from '@/components/shared/priorities/PriorityBadge';
import { PrioriteEnum } from '@/types/enums.types';
import { useAffectationRow } from '../../contexts/files-affectations.context';

const PRIORITY_SELECTOR_ITEMS = Object.values(PrioriteEnum);

export function NominationFilesPrioritySelectorCell(props: { fileId: string }) {
  const { priorities, prioritize } = useAffectationRow(props.fileId);

  const selected = React.useMemo(() => priorities ?? [], [priorities]);
  const setSelected = React.useCallback(
    (selected: readonly PrioriteEnum[]) => prioritize(new Set(selected)),
    [prioritize]
  );

  return (
    <DropdownSelectMultiple
      items={PRIORITY_SELECTOR_ITEMS}
      renderItem={(item) => <PriorityBadge priority={item} />}
      value={selected}
      onChange={setSelected}
      buttonProps={{ size: 'small', priority: 'tertiary no outline' }}
      title="Sélectionner les priorités"
    >
      {selected.length === 0 ? (
        <span className="text-sm">Priorités</span>
      ) : (
        <PriorityBadgeList priorities={selected} acronym />
      )}
    </DropdownSelectMultiple>
  );
}
