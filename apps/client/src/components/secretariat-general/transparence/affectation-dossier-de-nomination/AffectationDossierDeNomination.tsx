import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { colors } from '@codegouvfr/react-dsfr/fr/colors';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import Table from '@codegouvfr/react-dsfr/Table';
import type { ReactNode } from 'react';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState, useMemo } from 'react';

type SortField =
  | 'numero'
  | 'magistrat'
  | 'posteActuel'
  | 'grade'
  | 'posteCible'
  | 'observants'
  | 'priorite'
  | 'rapporteurs';
type SortDirection = 'asc' | 'desc' | null;

export const AffectationDossierDeNomination = () => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return 'fr-icon-arrow-down-line';
    }
    return sortDirection === 'asc' ? 'fr-icon-arrow-up-line' : 'fr-icon-arrow-down-line';
  };

  const TABLE_HEADER: ReactNode[] = [
    <span className="flex items-center gap-1">
      N°
      <Button
        iconId={getSortIcon('numero')}
        onClick={() => handleSort('numero')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par numéro"
      />
    </span>,
    <span className="flex items-center gap-1">
      Magistrat
      <Button
        iconId={getSortIcon('magistrat')}
        onClick={() => handleSort('magistrat')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par magistrat"
      />
    </span>,
    <span className="flex items-center gap-1">
      Poste actuel
      <Button
        iconId={getSortIcon('posteActuel')}
        onClick={() => handleSort('posteActuel')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par poste actuel"
      />
    </span>,
    <span className="flex items-center gap-1">
      Grade actuel
      <Button
        iconId={getSortIcon('grade')}
        onClick={() => handleSort('grade')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par grade"
      />
    </span>,
    <span className="flex items-center gap-1">
      Poste cible
      <Button
        iconId={getSortIcon('posteCible')}
        onClick={() => handleSort('posteCible')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par poste cible"
      />
    </span>,
    <span className="flex items-center gap-1">
      Observants
      <Button
        iconId={getSortIcon('observants')}
        onClick={() => handleSort('observants')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par observants"
      />
    </span>,
    <span className="flex items-center gap-1">
      Priorité
      <Button
        iconId={getSortIcon('priorite')}
        onClick={() => handleSort('priorite')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par priorité"
      />
    </span>,
    <span className="flex items-center gap-1">
      Rapporteur(s)
      <Button
        iconId={getSortIcon('rapporteurs')}
        onClick={() => handleSort('rapporteurs')}
        className="fr-btn--icon-only p-0 hover:bg-transparent"
        priority="tertiary no outline"
        title="Trier par rapporteurs"
      />
    </span>
  ];

  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  const sortedData = useMemo(() => {
    if (!dossiersDeNomination || !sortField || !sortDirection) {
      return dossiersDeNomination || [];
    }

    return [...dossiersDeNomination].sort((a, b) => {
      const contentA = a.content as ContenuPropositionDeNominationTransparenceV2;
      const contentB = b.content as ContenuPropositionDeNominationTransparenceV2;

      let valueA: string | number;
      let valueB: string | number;

      switch (sortField) {
        case 'numero':
          valueA = contentA.numeroDeDossier || '';
          valueB = contentB.numeroDeDossier || '';
          break;
        case 'magistrat':
          valueA = contentA.nomMagistrat || '';
          valueB = contentB.nomMagistrat || '';
          break;
        case 'posteActuel':
          valueA = contentA.posteActuel || '';
          valueB = contentB.posteActuel || '';
          break;
        case 'grade':
          valueA = contentA.grade || '';
          valueB = contentB.grade || '';
          break;
        case 'posteCible':
          valueA = contentA.posteCible || '';
          valueB = contentB.posteCible || '';
          break;
        case 'observants':
          valueA = contentA.observants?.join('\n').toLocaleUpperCase() || '';
          valueB = contentB.observants?.join('\n').toLocaleUpperCase() || '';
          break;
        case 'priorite':
          valueA = 'priorité'; // Valeur statique pour l'instant
          valueB = 'priorité';
          break;
        case 'rapporteurs':
          valueA = a.rapporteurs.join(' ').toLowerCase();
          valueB = b.rapporteurs.join(' ').toLowerCase();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [dossiersDeNomination, sortField, sortDirection]);

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
