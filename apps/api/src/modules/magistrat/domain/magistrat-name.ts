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

// documents keep the civility, the last name and the first name on the same line
export function magistratTitledFullName(magistrat: MagistratNames & { civility: Civility }): string {
  return `${magistrat.civility === 'MME' ? 'Mme' : 'M.'}\u00A0${writeFullName(magistrat, '\u00A0')}`;
}

export function proposedMagistratName(nominationFile: {
  detectedMagistrat: MagistratNames | null;
  name: string;
}): string {
  return nominationFile.detectedMagistrat
    ? magistratFullName(nominationFile.detectedMagistrat)
    : nominationFile.name;
}
