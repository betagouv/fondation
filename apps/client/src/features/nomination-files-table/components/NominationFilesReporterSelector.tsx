import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Input } from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import { useState, type FC } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExcludedJurisdictionIcon } from './ExcludedJurisdictionIcon';

export type SelectMultipleRapporteursProps = {
  availableRapporteurs: { userId: string; lastName: string; firstName: string }[];
  excludedTitleByRapporteurId?: ReadonlyMap<string, string>;
  selectedRapporteurs: string[];
  onSelectionChange: (rapporteurIds: string[]) => void;
};

const NO_EXCLUSION: ReadonlyMap<string, string> = new Map();

export const NominationFilesReporterSelector: FC<SelectMultipleRapporteursProps> = ({
  availableRapporteurs,
  excludedTitleByRapporteurId = NO_EXCLUSION,
  selectedRapporteurs,
  onSelectionChange,
}) => {
  const { formatMessage } = useIntl();
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRapporteur = (userId: string) => {
    const newSelection = selectedRapporteurs.includes(userId)
      ? selectedRapporteurs.filter((id) => id !== userId)
      : [...selectedRapporteurs, userId];
    onSelectionChange(newSelection);
  };

  const filteredRapporteurs = availableRapporteurs
    .filter((r) => `${r.lastName} ${r.firstName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="flex flex-col">
      <div className="fr-p-4v border-b border-(--border-default-grey)">
        <Input
          label=""
          nativeInputProps={{
            placeholder: formatMessage({ defaultMessage: 'Rechercher un rapporteur...' }),
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            type: 'text',
          }}
        />
      </div>

      <div className="fr-p-4v max-h-48 space-y-2 overflow-y-auto">
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
                      >
                        {excludedTitle && <ExcludedJurisdictionIcon />}
                        {`${rapporteur.lastName} ${rapporteur.firstName}`.toUpperCase()}
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
          <p className="fr-py-4v text-center text-sm text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucun rapporteur trouvé" />
          </p>
        )}
      </div>
    </div>
  );
};
