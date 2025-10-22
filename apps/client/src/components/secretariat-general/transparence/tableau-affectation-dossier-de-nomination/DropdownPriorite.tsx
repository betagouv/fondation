import type { FC } from 'react';
import { PrioriteEnum, PrioriteLabels } from 'shared-models/models/priorite.enum';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';
import { DropdownSelect } from '../../../shared/DropdownSelect';

export interface DropdownPrioriteProps {
  dossierId: string;
  initialPriorite?: PrioriteEnum;
}

export const DropdownPriorite: FC<DropdownPrioriteProps> = ({ dossierId, initialPriorite }) => {
  const { priorites, updatePriorite } = useAffectation();
  const selectedPriorite = priorites[dossierId] ?? initialPriorite;

  const options = Object.values(PrioriteEnum).map((priorite) => ({
    value: priorite,
    label: PrioriteLabels[priorite]
  }));

  return (
    <DropdownSelect
      options={options}
      value={selectedPriorite}
      onChange={(value) => updatePriorite(dossierId, value)}
      placeholder="Sélectionner"
    />
  );
};
