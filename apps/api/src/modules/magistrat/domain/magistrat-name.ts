import { capitalize } from 'src/utils/capitalize';

export const CIVILITIES = ['M.', 'MME'] as const;
export type Civility = (typeof CIVILITIES)[number];

type MagistratNames = { firstName: string; lastName: string; marriedName: string | null };

function upperName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

function writeFullName(magistrat: MagistratNames, separator: string): string {
  const lastName = upperName(magistrat.lastName);
  const firstName = capitalize(magistrat.firstName.trim().toLowerCase());
  const marriedName = magistrat.marriedName && upperName(magistrat.marriedName);
  const fullName = `${lastName}${separator}${firstName}`;
  return marriedName && marriedName !== lastName ? `${fullName} (ép. ${marriedName})` : fullName;
}

export function magistratFullName(magistrat: MagistratNames): string {
  return writeFullName(magistrat, ' ');
}

const TITLES: Record<Civility, string> = { 'M.': 'M.', MME: 'Mme' };

function isCivility(civility: string): civility is Civility {
  return Object.hasOwn(TITLES, civility);
}

// the civility, the last name and the first name stay on the same line, in a heading as in a document
// LOLFI sends the civility as free text: an unexpected one is left out rather than blocking the display
export function magistratTitledFullName(magistrat: MagistratNames & { civility: string }): string {
  const fullName = writeFullName(magistrat, '\u00A0');
  return isCivility(magistrat.civility) ? `${TITLES[magistrat.civility]}\u00A0${fullName}` : fullName;
}

export function proposedMagistratName(nominationFile: {
  detectedMagistrat: MagistratNames | null;
  name: string;
}): string {
  return nominationFile.detectedMagistrat
    ? magistratFullName(nominationFile.detectedMagistrat)
    : nominationFile.name;
}
