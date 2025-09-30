import type { ReactNode } from 'react';
import React from 'react';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import type { FiltersState } from '../../../shared/filter-configurations';

export const HEADER_COLUMNS: Array<{ field: string; label: string }> = [
  { field: 'content.numeroDeDossier', label: 'N°' },
  { field: 'content.nomMagistrat', label: 'Magistrat' },
  { field: 'content.posteActuel', label: 'Poste actuel' },
  { field: 'content.grade', label: 'Grade actuel' },
  { field: 'content.posteCible', label: 'Poste cible' },
  // TODO AJOUTER LA FONCTION DE TRI
  { field: 'content.gradeCible', label: 'Grade cible' },
  { field: 'content.observants', label: 'Observants' },
  { field: 'content.priorite', label: 'Priorité' },
  { field: 'content.rapporteurs', label: 'Rapporteur(s)' }
];

export const dataRows = (data: DossierDeNominationEtAffectationSnapshot[]): ReactNode[][] => {
  return data.map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    const rapporteurs = dossier.rapporteurs.join('\n').toLocaleUpperCase();
    const gradeCible = content.posteCible.substring(content.posteCible.lastIndexOf('-') + 1);
    const posteCible = content.posteCible.substring(0, content.posteCible.lastIndexOf('-'));

    return [
      content.numeroDeDossier,
      content.nomMagistrat,
      content.posteActuel,
      content.grade,
      posteCible,
      gradeCible,
      content.observants,
      'priorité',
      React.createElement('span', { className: 'whitespace-pre-line' }, rapporteurs)
    ];
  });
};

export const applyFilters = (data: DossierDeNominationEtAffectationSnapshot[], filters: FiltersState) => {
  return data.filter((dossier) => {
    // Si aucun filtre de rapporteurs n'est appliqué, garder tous les dossiers
    if (!filters.rapporteurs || filters.rapporteurs.length === 0) {
      return true;
    }

    // Garder seulement les dossiers qui contiennent TOUS les rapporteurs sélectionnés
    return filters.rapporteurs.some((rapporteur) => dossier.rapporteurs.includes(rapporteur));
  });
};
