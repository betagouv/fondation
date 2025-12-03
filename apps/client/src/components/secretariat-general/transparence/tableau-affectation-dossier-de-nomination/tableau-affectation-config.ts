import type { ReactNode, RefObject } from 'react';
import React from 'react';
import type { Magistrat, UserDescriptorSerialized } from 'shared-models';
import { PrioriteLabels } from 'shared-models/models/priorite.enum';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import { DateOnly } from '../../../../models/date-only.model';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { FILTER_RAPPORTEUR_NOBODY, type FiltersState } from '../../../shared/filter-configurations';
import { CheckboxDossier } from './CheckboxDossier';
import { DropdownPriorite } from './DropdownPriorite';
import { DropdownRapporteurs } from './DropdownRapporteurs';
import { MagistratDnModalLink } from './MagistratDnModale';

export const HEADER_COLUMNS_AFFECTATIONS_DN = [
  { field: 'content.numeroDeDossier', label: 'N°' },
  { field: 'content.nomMagistrat', label: 'Magistrat' },
  { field: 'content.grade', label: 'Grade actuel' },
  { field: 'content.posteCible', label: 'Poste cible' },
  { field: 'content.gradeCible', label: 'Grade cible' },
  { field: 'content.observants', label: 'Observant(s)' },
  { field: 'content.priorite', label: 'Priorité' },
  { field: 'content.rapporteurs', label: 'Rapporteur(s)' },
  { field: 'content.dateEchéance', label: "Date d'écheance" }
] as const satisfies { field: string; label: string }[];

export const HEADER_COLUMNS_AFFECTATIONS_DN_EDITION = [
  { field: 'checkbox', label: '' },
  ...HEADER_COLUMNS_AFFECTATIONS_DN
] as const satisfies { field: string; label: string }[];

export const dataRowsDn = (options: {
  data: SessionNominationFile[];
  magistratModalRef: RefObject<HTMLDivElement | null>;
  formation: Magistrat.Formation;
}): ReactNode[][] => {
  return options.data.map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    const gradeCible = content.posteCible.substring(content.posteCible.lastIndexOf('-') + 1);
    const posteCible = content.posteCible.substring(0, content.posteCible.lastIndexOf('-'));
    const rapporteursNames = dossier.reporters
      .map((r) => r.firstName + ' ' + r.lastName)
      .join('\n')
      .toLocaleUpperCase();

    return [
      content.numeroDeDossier,
      React.createElement(MagistratDnModalLink, {
        nominationFile: dossier,
        modalRef: options.magistratModalRef,
        formation: options.formation
      }),
      // content.posteActuel,
      content.grade,
      posteCible,
      gradeCible,
      content.observants && content.observants.length > 0 ? content.observants : '-',
      dossier.priority ? PrioriteLabels[dossier.priority] : '-',
      React.createElement('span', { className: 'whitespace-pre-line' }, rapporteursNames),
      content.dateEchéance && DateOnly.fromDateOnly(content.dateEchéance)
    ];
  });
};

export const dataRowsDnEdition = (options: {
  data: SessionNominationFile[];
  availableRapporteurs: UserDescriptorSerialized[];
  magistratModalRef: RefObject<HTMLDivElement | null>;
  formation: Magistrat.Formation;
}): ReactNode[][] => {
  return options.data.map((dossier) => {
    const content = dossier.content;
    const gradeCible = content.posteCible.substring(content.posteCible.lastIndexOf('-') + 1);
    const posteCible = content.posteCible.substring(0, content.posteCible.lastIndexOf('-'));
    const initialRapporteurIds = dossier.reporters.map((r) => r.id);

    return [
      React.createElement('div', {
        className: 'size-full items-center flex justify-center',
        children: React.createElement(CheckboxDossier, { dossierId: dossier.id })
      }),
      content.numeroDeDossier,
      React.createElement(MagistratDnModalLink, {
        nominationFile: dossier,
        modalRef: options.magistratModalRef,
        formation: options.formation
      }),
      // content.posteActuel,
      content.grade,
      posteCible,
      gradeCible,
      content.observants,
      React.createElement(DropdownPriorite, {
        dossierId: dossier.id,
        initialPriorite: dossier.priority ?? undefined
      }),
      React.createElement(DropdownRapporteurs, {
        dossierId: dossier.id,
        initialRapporteurs: initialRapporteurIds,
        availableRapporteurs: options.availableRapporteurs
      }),
      content.dateEchéance && DateOnly.fromDateOnly(content.dateEchéance)
    ];
  });
};

export const applyFilters = (data: SessionNominationFile[], filters: FiltersState) => {
  return data.filter((dossier) => {
    if (filters.priorite && filters.priorite.length > 0) {
      return false;
    }

    if (!filters.rapporteurs || filters.rapporteurs.length === 0) {
      return true;
    }

    return filters.rapporteurs.some((nom) =>
      nom === FILTER_RAPPORTEUR_NOBODY.value
        ? (dossier.reporters?.length ?? 0) === 0
        : dossier.reporters.some((r) => r.firstName + ' ' + r.lastName === nom)
    );
  });
};

export const sortValueSpecificDnField = (item: SessionNominationFile, field: string) => {
  if (field === 'content.gradeCible') {
    const posteCible = item.content?.posteCible || '';
    return posteCible.substring(posteCible.lastIndexOf('-') + 1);
  }
  return undefined;
};
