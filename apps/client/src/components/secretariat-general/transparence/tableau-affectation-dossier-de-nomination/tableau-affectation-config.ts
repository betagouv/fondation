import type { ReactNode, RefObject } from 'react';
import React from 'react';
import type { Magistrat } from 'shared-models';
import { PrioriteLabels } from 'shared-models/models/priorite.enum';
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
  return options.data.map((dossier) => [
    dossier.content.numeroDeDossier,
    React.createElement(MagistratDnModalLink, {
      nominationFile: dossier,
      modalRef: options.magistratModalRef,
      formation: options.formation
    }),
    dossier.content.grade,
    dossier.content.posteCible,
    dossier.content.gradeCible,
    dossier.content.observants && dossier.content.observants.length > 0 ? dossier.content.observants : '-',
    dossier.priority ? PrioriteLabels[dossier.priority] : '-',
    React.createElement(
      'span',
      { className: 'whitespace-pre-line' },
      dossier.reporters.map(({ firstName, lastName }) => `${firstName} ${lastName}`.toUpperCase()).join('\n')
    ),
    dossier.content.dateEchéance && DateOnly.fromDateOnly(dossier.content.dateEchéance)
  ]);
};

export const dataRowsDnEdition = (options: {
  data: SessionNominationFile[];
  availableRapporteurs: { userId: string; firstName: string; lastName: string }[];
  magistratModalRef: RefObject<HTMLDivElement | null>;
  formation: Magistrat.Formation;
}): ReactNode[][] => {
  return options.data.map((dossier) => [
    React.createElement('div', {
      className: 'size-full items-center flex justify-center',
      children: React.createElement(CheckboxDossier, { dossierId: dossier.id })
    }),
    dossier.content.numeroDeDossier,
    React.createElement(MagistratDnModalLink, {
      nominationFile: dossier,
      modalRef: options.magistratModalRef,
      formation: options.formation
    }),
    dossier.content.grade,
    dossier.content.posteCible,
    dossier.content.gradeCible,
    dossier.content.observants,
    React.createElement(DropdownPriorite, {
      dossierId: dossier.id,
      initialPriorite: dossier.priority ?? undefined
    }),
    React.createElement(DropdownRapporteurs, {
      dossierId: dossier.id,
      initialRapporteurs: dossier.reporters.map(({ id }) => id),
      availableRapporteurs: options.availableRapporteurs
    }),
    dossier.content.dateEchéance && DateOnly.fromDateOnly(dossier.content.dateEchéance)
  ]);
};

export const applyFilters = (data: SessionNominationFile[], filters: FiltersState) =>
  data.filter((dossier) => {
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
