import { Select } from '@codegouvfr/react-dsfr/Select';
import type { FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';

export type InputAffectationProps = {
  initialRapporteurs: string[];
  availableRapporteurs: UserDescriptorSerialized[];
};

export const InputAffectation: FC<InputAffectationProps> = ({ initialRapporteurs, availableRapporteurs }) => {
  // TODO IMPLEMENTER LA SELECTION DE RAPPORTEURS

  return (
    <div>
      {initialRapporteurs.join('\n').toLocaleUpperCase()}
      <Select label="" nativeSelectProps={{}}>
        {availableRapporteurs.map((rapporteur) => (
          <option key={rapporteur.userId} value={rapporteur.userId}>
            {rapporteur.lastName} {rapporteur.firstName}
          </option>
        ))}
      </Select>
    </div>
  );
};
