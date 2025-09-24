import { Select } from '@codegouvfr/react-dsfr/Select';
import type { FC } from 'react';

export type InputAffectationProps = {
  initialRapporteurs: string[];
};

export const InputAffectation: FC<InputAffectationProps> = ({ initialRapporteurs }) => {
  // Récupérer la liste de tous les rapporteurs possibles pour le formation en cours.
  return (
    <div>
      {initialRapporteurs.join('\n').toLocaleUpperCase()}
      <Select label="rapporteurs" nativeSelectProps={{}}>
        <option value="" disabled hidden>
          Selectionnez une option
        </option>
      </Select>
    </div>
  );
};
