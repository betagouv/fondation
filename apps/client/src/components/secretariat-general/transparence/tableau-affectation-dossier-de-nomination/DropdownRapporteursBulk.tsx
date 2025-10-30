import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useState, type FC } from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import { useAffectation } from '../../../../contexts/AffectationDossiersContext';

export type DropdownRapporteursBulkProps = {
  availableRapporteurs: UserDescriptorSerialized[];
};

export const DropdownRapporteursBulk: FC<DropdownRapporteursBulkProps> = ({ availableRapporteurs }) => {
  const { selectedDossierIds, updateAffectation } = useAffectation();
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelection, setLocalSelection] = useState<Set<string>>(new Set());

  const toggleRapporteur = (userId: string) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setLocalSelection(newSelection);

    // Appliquer immédiatement l'affectation à tous les dossiers sélectionnés
    const rapporteurIds = Array.from(newSelection);
    Array.from(selectedDossierIds).forEach((dossierId) => {
      updateAffectation(dossierId, rapporteurIds);
    });
  };

  // Filtrer les rapporteurs selon la recherche
  const filteredRapporteurs = availableRapporteurs.filter((r) =>
    `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[300px]">
      <div className="border-b border-gray-200 p-4">
        <Input
          label=""
          nativeInputProps={{
            placeholder: 'Rechercher un rapporteur...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            type: 'text'
          }}
        />
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto p-4">
        {filteredRapporteurs.length > 0 ? (
          filteredRapporteurs.map((rapporteur) => (
            <Checkbox
              key={rapporteur.userId}
              options={[
                {
                  label: `${rapporteur.lastName} ${rapporteur.firstName}`,
                  nativeInputProps: {
                    checked: localSelection.has(rapporteur.userId),
                    onChange: () => toggleRapporteur(rapporteur.userId)
                  }
                }
              ]}
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">Aucun rapporteur trouvé</p>
        )}
      </div>
    </div>
  );
};
