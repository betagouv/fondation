import type { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr';
import { useMemo, useState } from 'react';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import type { SortDirection, SortField } from '../types/table.types';

export const useSort = <T extends DossierDeNominationEtAffectationSnapshot>(dataToSort: T[]) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getSortIcon = (field: SortField): FrIconClassName | RiIconClassName => {
    if (sortField !== field) {
      return 'fr-icon-arrow-down-line';
    }
    return sortDirection === 'asc' ? 'fr-icon-arrow-up-line' : 'fr-icon-arrow-down-line';
  };

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

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) {
      return dataToSort;
    }

    return [...dataToSort].sort((a, b) => {
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
        case 'gradeActuel':
          valueA = contentA.grade || '';
          valueB = contentB.grade || '';
          break;
        case 'posteCible':
          valueA = contentA.posteCible || '';
          valueB = contentB.posteCible || '';
          break;
        case 'gradeCible':
          valueA = contentA.posteCible.substring(contentA.posteCible.lastIndexOf('-') + 1) || '';
          valueB = contentB.posteCible.substring(contentB.posteCible.lastIndexOf('-') + 1) || '';
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
  }, [dataToSort, sortField, sortDirection]);

  return { handleSort, getSortIcon, sortedData };
};
