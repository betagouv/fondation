import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import { useState, type FC, type ReactNode } from 'react';

import { DropdownMenu } from '@/shared/ui/DropdownMenu';

export type RapporteursDropdownBaseProps = {
  availableRapporteurs: { userId: string; firstName: string; lastName: string }[];
  selectedRapporteurs: string[];
  excludedTitleByRapporteurId?: ReadonlyMap<string, string>;
  onSelectionChange: (rapporteurIds: string[]) => void;
  buttonLabel: ReactNode;
};

const NO_EXCLUSION: ReadonlyMap<string, string> = new Map();

export const RapporteursDropdownBase: FC<RapporteursDropdownBaseProps> = ({
  availableRapporteurs,
  selectedRapporteurs,
  excludedTitleByRapporteurId = NO_EXCLUSION,
  onSelectionChange,
  buttonLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRapporteur = (userId: string) => {
    const newSelection = selectedRapporteurs.includes(userId)
      ? selectedRapporteurs.filter((id) => id !== userId)
      : [...selectedRapporteurs, userId];
    onSelectionChange(newSelection);
  };

  // Filtrer les rapporteurs selon la recherche
  const filteredRapporteurs = availableRapporteurs
    .filter((r) => `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const trigger = (
    <Button
      priority="tertiary no outline"
      size="small"
      iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
      iconPosition="right"
      title="Sélectionner des rapporteurs"
    >
      {buttonLabel}
    </Button>
  );

  const content = (
    <div className="max-h-96 min-w-[300px] overflow-hidden rounded-sm border border-(--border-default-grey) bg-(--background-default-grey) shadow-lg">
      <div className="fr-p-4v border-b border-(--border-default-grey)">
        <Input
          label=""
          nativeInputProps={{
            placeholder: 'Rechercher un rapporteur...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            type: 'text',
          }}
        />
      </div>

      <div className="fr-p-4v max-h-64 space-y-2 overflow-y-auto">
        {filteredRapporteurs.length > 0 ? (
          filteredRapporteurs.map((rapporteur) => {
            const excludedTitle = excludedTitleByRapporteurId.get(rapporteur.userId);

            return (
              <Checkbox
                key={rapporteur.userId}
                options={[
                  {
                    label: (
                      <span
                        className={clsx(
                          'flex items-center gap-1.5',
                          excludedTitle && 'text-(--text-default-warning)',
                        )}
                        title={excludedTitle}
                      >
                        {`${rapporteur.lastName.toUpperCase()} ${rapporteur.firstName.toUpperCase()}`}
                        {excludedTitle && <span className="fr-sr-only">{excludedTitle}</span>}
                      </span>
                    ),
                    nativeInputProps: {
                      checked: selectedRapporteurs.includes(rapporteur.userId),
                      onChange: () => toggleRapporteur(rapporteur.userId),
                    },
                  },
                ]}
              />
            );
          })
        ) : (
          <p className="fr-py-4v text-center text-sm text-(--text-mention-grey)">Aucun rapporteur trouvé</p>
        )}
      </div>
    </div>
  );

  return (
    <DropdownMenu trigger={trigger} isOpen={isOpen} onOpenChange={setIsOpen}>
      {content}
    </DropdownMenu>
  );
};
