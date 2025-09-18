import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { colors } from '@codegouvfr/react-dsfr/fr/colors';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';

import { useSort } from '../../../../hooks/useSort.hook';
import { ExcelExport } from './ExcelExport';
import type { SortField } from '../../../../types/table-sort.types';
import Tag from '@codegouvfr/react-dsfr/Tag';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { FiltreFormation } from './FiltreFormation';

export const TableauAffectationDossierDeNomination = () => {
  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  const { handleSort, getSortIcon, sortedData } = useSort(dossiersDeNomination || []);

  const headers: Array<{ field: SortField; label: string }> = [
    { field: 'numero', label: 'N°' },
    { field: 'magistrat', label: 'Magistrat' },
    { field: 'posteActuel', label: 'Poste actuel' },
    { field: 'grade', label: 'Grade' },
    { field: 'posteCible', label: 'Poste cible' },
    { field: 'observants', label: 'Observants' },
    { field: 'priorite', label: 'Priorité' },
    { field: 'rapporteurs', label: 'Rapporteur(s)' }
  ];

  const TABLE_HEADER: ReactNode[] = headers.map((header) => (
    <span className="flex items-center gap-1">
      {header.label}
      <Button
        iconId={getSortIcon(header.field)}
        onClick={() => handleSort(header.field)}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title={`Trier par ${header.label}`}
      />
    </span>
  ));

  const dataRows = sortedData.map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    const rapporteurs = dossier.rapporteurs.join('\n').toLocaleUpperCase();
    return [
      content.numeroDeDossier,
      content.nomMagistrat,
      content.posteActuel,
      content.grade,
      content.posteCible,
      content.observants,
      'priorité',
      <span className="whitespace-pre-line">{rapporteurs}</span>
    ];
  });

  return (
    <div id="session-affectation-dossier-de-nomination">
      {/* Préchargement des icônes pour éviter les problèmes de chargement conditionnel */}
      <div style={{ display: 'none' }}>
        <Button iconId="fr-icon-arrow-down-line" onClick={() => {}} children={null} />
        <Button iconId="fr-icon-arrow-up-line" onClick={() => {}} children={null} />
      </div>

      <ExcelExport data={sortedData} />

      <div id="filtre-tableau-affectation-dossier-de-nomination">
        Filtrer par
        <FiltreFormation />
      </div>

      {isLoadingDossiersDeNomination && <div>Chargement des dossiers de nomination...</div>}
      {isErrorDossiersDeNomination && (
        <div style={{ color: colors.options.error._425_625.default }}>
          Erreur lors de la récupération des dossiers de nomination
        </div>
      )}
      {!isLoadingDossiersDeNomination && (
        <Table
          id="session-affectation-dossier-de-nomination-table"
          bordered
          headers={TABLE_HEADER}
          data={dataRows}
        />
      )}
    </div>
  );
};
