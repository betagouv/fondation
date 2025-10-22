import type { FC } from 'react';
import { PrioriteEnum, PrioriteLabels } from 'shared-models/models/priorite.enum';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { DropdownSelect } from '../../../shared/DropdownSelect';

export interface DropdownPrioriteProps {
  dossierId: string;
  initialPriorite?: PrioriteEnum;
}

const EMPTY_VALUE = '__EMPTY__' as const;

export const DropdownPriorite: FC<DropdownPrioriteProps> = ({ dossierId, initialPriorite }) => {
  const { priorites, updatePriorite, clearPriorite } = useAffectation();
  const selectedPriorite = priorites[dossierId] ?? initialPriorite;

  const options = [
    { value: EMPTY_VALUE, label: 'Aucune' },
    ...Object.values(PrioriteEnum).map((priorite) => ({
      value: priorite,
      label: PrioriteLabels[priorite]
    }))
  ];

  const handleChange = (value: string) => {
    if (value === EMPTY_VALUE) {
      clearPriorite(dossierId);
    } else {
      updatePriorite(dossierId, value as PrioriteEnum);
    }
  };

  return (
    <DropdownSelect
      options={options}
      value={selectedPriorite ?? EMPTY_VALUE}
      onChange={handleChange}
      placeholder="Sélectionner"
    />
  );
};
