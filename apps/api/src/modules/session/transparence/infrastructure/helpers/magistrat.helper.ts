import { capitalize } from '../../../../../utils/capitalize';
import { type Civility } from '../../../../magistrat/domain/magistrat-name';
import { GenderEnum } from '../../../../shared/gender.enum';

export function buildMemberName(member: { firstName: string; gender: GenderEnum; lastName: string }): string {
  return `${member.gender === GenderEnum.FEMALE ? 'Mme' : 'M.'}\u00A0${capitalize(member.firstName.toLowerCase())}\u00A0${member.lastName.toUpperCase()}`;
}

// the codes seen in production: a code LOLFI adds later falls back to "sans affectation"
const PLACEMENTS = new Map([
  ['CPR', 'congé parental'],
  ['D47-1', 'disponibilité'],
  ['D47-1B', 'disponibilité'],
  ['D47-2', 'disponibilité'],
  ['D4B', 'disponibilité'],
  ['D7D', 'disponibilité'],
  ['DET', 'détachement'],
  ['DI3', 'disponibilité'],
  ['DI6', 'disponibilité'],
]);

const NATIONAL_PROSECUTOR_OFFICES = new Set(['PNA PARIS', 'PNACPARIS', 'PNF PARIS']);

// LOLFI names it "chargé du service de la section", which the CSM never writes
const DETACHED_SECTION_PRESIDENCY = {
  female: "vice-présidente chargée de la présidence d'une section détachée",
  male: "vice-président chargé de la présidence d'une section détachée",
};

export function buildPosition(options: {
  civility: Civility;
  position: {
    administrativePositionId?: string | null;
    arrondissement: { id: string; label: string } | null;
    function: {
      addition: string | null;
      id: string;
      label: string;
      labelOneFemale: string | null;
      labelOneMale: string | null;
    } | null;
    jurisdiction: { id: string; label: string };
  };
}): string | null {
  const { civility, position } = options;

  if (['DETACHEMENT', 'SANS AFFECTATION'].includes(position.jurisdiction.id)) {
    const placed =
      PLACEMENTS.get(position.administrativePositionId ?? '') ??
      (position.jurisdiction.id === 'DETACHEMENT' ? 'détachement' : null);

    return placed ? `magistrat placé en position de ${placed}` : 'sans affectation';
  }

  if (position.function === null) return null;

  const codejur =
    position.jurisdiction.id === 'CC  PARIS'
      ? position.jurisdiction.label
      : position.jurisdiction.label[0]!.toLowerCase() + position.jurisdiction.label.slice(1);

  if (position.function.id === 'VPSEC') {
    return `${DETACHED_SECTION_PRESIDENCY[civility === 'M.' ? 'male' : 'female']} au ${codejur}`;
  }

  // LOLFI keeps "des fonctions" for the premier vice-président only, not for the vice-président
  const gendered = (
    civility === 'M.' ? position.function.labelOneMale : position.function.labelOneFemale
  )?.replace("des fonctions de l'application des peines", "de l'application des peines");
  // LOLFI capitalizes a few labels, which always sit mid-sentence
  let label = gendered
    ? gendered[0]!.toLowerCase() + gendered.slice(1)
    : position.function.label.toLowerCase().replace('république', 'République');

  // the CSM writes "Justice" with a capital for the head of the inspection only
  if (position.function.id === 'IG-CIGJ') label = label.replace('de la justice', 'de la Justice');

  if (NATIONAL_PROSECUTOR_OFFICES.has(position.jurisdiction.id)) {
    return `${label} près le tribunal judiciaire de Paris`;
  }

  if (!gendered) return `${label}, ${codejur}`;

  if (position.function.id === 'JCP' || position.function.id === 'VPCP' || position.function.id === '1VPCP') {
    if (position.arrondissement) {
      const arrondissement =
        position.arrondissement!.label[0]!.toLowerCase() + position.arrondissement!.label.slice(1);
      label += ` au ${arrondissement},`;
    } else {
      return label + ` au ${codejur}`;
    }
  }

  if (['AC  PARIS', 'IGSJPARIS'].includes(position.jurisdiction.id)) {
    return label;
  }

  if (position.jurisdiction.id === 'CC  PARIS' && ['1AG', 'AG'].includes(position.function.id)) {
    return `${label} à la Cour de cassation`;
  }

  if (!position.function.addition) {
    return `${label}, ${codejur}`;
  }

  const jurisdiction = position.function.addition
    .replace('affecté', () => (civility === 'MME' ? 'affectée' : 'affecté'))
    .replace('{codejur}', codejur);

  return `${label} ${jurisdiction}`;
}
