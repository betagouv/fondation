import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { DropdownSelect, type DropdownSelectOption } from '../../../shared/DropdownFilter';

export type InputAffectationProps = {
  initialRapporteurs: string[];
  availableRapporteurs: UserDescriptorSerialized[];
};

export const InputAffectation: FC<InputAffectationProps> = ({ initialRapporteurs, availableRapporteurs }) => {
  const [selectedRapporteurs, setSelectedRapporteurs] = useState<string[]>(initialRapporteurs);

  const rapporteurOptions: DropdownSelectOption[] = availableRapporteurs.map((rapporteur) => ({
    value: rapporteur.userId,
    label: `${rapporteur.lastName} ${rapporteur.firstName}`
  }));

  const handleSelectionChange = (selectedOptions: string[]) => {
    setSelectedRapporteurs(selectedOptions);
  };

  return (
    <DropdownSelect
      className="bg-transparent"
      tagName="Rapporteurs"
      options={rapporteurOptions}
      selectedValues={selectedRapporteurs}
      onSelectionChange={handleSelectionChange}
      useFixedPositioning={true}
    />
  );
};
