import { Select } from '@codegouvfr/react-dsfr/Select';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';

export type InputAffectationProps = {
  initialRapporteurs: string[];
  availableRapporteurs: UserDescriptorSerialized[];
};

export const InputAffectation: FC<InputAffectationProps> = ({ initialRapporteurs, availableRapporteurs }) => {
  const [selectedRapporteurs, setSelectedRapporteurs] = useState<string[]>(initialRapporteurs);

  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedRapporteurs(selectedOptions);
  };

  return (
    <div>
      <Select
        label=""
        nativeSelectProps={{
          multiple: true,
          value: selectedRapporteurs,
          onChange: handleSelectionChange
        }}
      >
        {availableRapporteurs.map((rapporteur) => (
          <option key={rapporteur.userId} value={rapporteur.userId}>
            {rapporteur.lastName} {rapporteur.firstName}
          </option>
        ))}
      </Select>
    </div>
  );
};
