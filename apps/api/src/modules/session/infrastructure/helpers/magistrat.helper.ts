import { capitalize } from 'src/utils/capitalize';

type CivilityEnum = 'M.' | 'MME';

export function buildName(options: {
  civility: CivilityEnum;
  firstName: string;
  lastName: string;
  usedName: string | null;
}): string {
  return `${options.civility === 'MME' ? 'Mme' : 'M.'} ${capitalize(options.firstName.toLowerCase())}\u00A0${(options.usedName || options.lastName).toUpperCase()}`;
}

export function buildPosition(options: {
  civility: CivilityEnum;
  position: {
    jurisdiction: { id: string; label: string };
    arrondissement: { id: string; label: string } | null;
    function: {
      id: string;
      label: string;
      labelOneMale: string | null;
      labelOneFemale: string | null;
      addition: string | null;
    } | null;
  };
}): string | null {
  const { civility, position } = options;

  if (position.jurisdiction.id === 'SANS AFFECTATION') return 'sans affectation';

  if (position.jurisdiction.id === 'DETACHEMENT') return 'en détachement';

  if (position.function === null) return null;

  const codejur = position.jurisdiction.label[0]!.toLowerCase() + position.jurisdiction.label.slice(1);

  if (
    (civility === 'M.' && !position.function.labelOneMale) ||
    (civility === 'MME' && !position.function.labelOneFemale)
  ) {
    return `${position.function.label.toLowerCase()}, ${codejur}`;
  }

  let label: string;
  if (civility === 'M.') {
    label = position.function.labelOneMale!;
  } else {
    label = position.function.labelOneFemale!;
  }

  if (position.function.id === 'JCP' || position.function.id === 'VPCP' || position.function.id === '1VPCP') {
    if (position.arrondissement) {
      const arrondissement =
        position.arrondissement!.label[0]!.toLowerCase() + position.arrondissement!.label.slice(1);
      label += ` au ${arrondissement},`;
    } else {
      return label + ` au ${codejur}`;
    }
  }

  if (position.jurisdiction.id === 'AC  PARIS') {
    return label;
  }

  if (position.jurisdiction.id === 'CC  PARIS' && ['1AG', 'AG'].includes(position.function.id)) {
    return `${label} à la cour de cassation`;
  }

  if (!position.function.addition) {
    return `${label}, ${codejur}`;
  }

  const jurisdiction = position.function.addition
    .replace('affecté', () => (civility === 'MME' ? 'affectée' : 'affecté'))
    .replace('{codejur}', codejur);

  return `${label} ${jurisdiction}`;
}
