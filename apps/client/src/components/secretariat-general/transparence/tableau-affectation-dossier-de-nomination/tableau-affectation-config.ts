import type { ReactNode } from 'react';
import React from 'react';
import type { UserDescriptorSerialized } from 'shared-models';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { DateOnly } from '../../../../models/date-only.model';
import type { FiltersState } from '../../../shared/filter-configurations';
import { DropdownRapporteurs } from './DropdownRapporteurs';
import { MagistratDnModale } from './MagistratDnModale';

export const HEADER_COLUMNS_AFFECTATIONS_DN: Array<{ field: string; label: string }> = [
  { field: 'content.numeroDeDossier', label: 'N°' },
  { field: 'content.nomMagistrat', label: 'Magistrat' },
  // { field: 'content.posteActuel', label: 'Poste actuel' },
  { field: 'content.grade', label: 'Grade actuel' },
  { field: 'content.posteCible', label: 'Poste cible' },
  { field: 'content.gradeCible', label: 'Grade cible' },
  { field: 'content.observants', label: 'Observants' },
  // { field: 'content.priorite', label: 'Priorité' },
  { field: 'content.rapporteurs', label: 'Rapporteur(s)' },
  { field: 'content.dateEchéance', label: "Date d'écheance" }
];

export const dataRowsDn = (data: DossierDeNominationEtAffectationSnapshot[]): ReactNode[][] => {
  return data.map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    const gradeCible = content.posteCible.substring(content.posteCible.lastIndexOf('-') + 1);
    const posteCible = content.posteCible.substring(0, content.posteCible.lastIndexOf('-'));
    const rapporteursNames = dossier.rapporteurs
      .map((r) => r.nom)
      .join('\n')
      .toLocaleUpperCase();

    return [
      content.numeroDeDossier,
      React.createElement(MagistratDnModale, { content, idDn: dossier.id }),
      content.posteActuel,
      content.grade,
      posteCible,
      gradeCible,
      content.observants,
      // 'priorité',
      React.createElement('span', { className: 'whitespace-pre-line' }, rapporteursNames),
      content.dateEchéance && DateOnly.fromDateOnly(content.dateEchéance)
    ];
  });
};

export const dataRowsDnEdition = (
  data: DossierDeNominationEtAffectationSnapshot[],
  availableRapporteurs: UserDescriptorSerialized[]
): ReactNode[][] => {
  return data.map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    const gradeCible = content.posteCible.substring(content.posteCible.lastIndexOf('-') + 1);
    const posteCible = content.posteCible.substring(0, content.posteCible.lastIndexOf('-'));
    const initialRapporteurIds = dossier.rapporteurs.map((r) => r.userId);

    return [
      content.numeroDeDossier,
      React.createElement(MagistratDnModale, { content, idDn: dossier.id }),
      // content.posteActuel,
      content.grade,
      posteCible,
      gradeCible,
      content.observants,
      // 'priorité',
      React.createElement(DropdownRapporteurs, {
        dossierId: dossier.id,
        initialRapporteurs: initialRapporteurIds,
        availableRapporteurs
      }),
      content.dateEchéance && DateOnly.fromDateOnly(content.dateEchéance)
    ];
  });
};

export const applyFilters = (data: DossierDeNominationEtAffectationSnapshot[], filters: FiltersState) => {
  return data.filter((dossier) => {
    if (filters.priorite && filters.priorite.length > 0) {
      return false;
    }

    if (!filters.rapporteurs || filters.rapporteurs.length === 0) {
      return true;
    }

    return filters.rapporteurs.some((nom) => dossier.rapporteurs.some((r) => r.nom === nom));
  });
};

export const sortValueSpecificDnField = (
  item: NonNullable<DossierDeNominationEtAffectationSnapshot>,
  field: string
) => {
  if (field === 'content.gradeCible') {
    const content = item.content as ContenuPropositionDeNominationTransparenceV2;
    const posteCible = content?.posteCible || '';
    return posteCible.substring(posteCible.lastIndexOf('-') + 1);
  }
  return undefined;
};
