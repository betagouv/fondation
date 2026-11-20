import { capitalize } from '../../../utils/capitalize';

export const CIVILITIES = ['M.', 'MME'] as const;
export type Civility = (typeof CIVILITIES)[number];

type MagistratNames = { firstName: string; lastName: string; marriedName: string | null };

function upperName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

function writeFullName(
  magistrat: MagistratNames,
  write: (names: { firstName: string; lastName: string }) => string,
): string {
  const lastName = upperName(magistrat.lastName);
  const firstName = capitalize(magistrat.firstName.trim().toLowerCase());
  const marriedName = magistrat.marriedName && upperName(magistrat.marriedName);
  const fullName = write({ firstName, lastName });
  return marriedName && marriedName !== lastName ? `${fullName} (ép. ${marriedName})` : fullName;
}

export function magistratFullName(magistrat: MagistratNames): string {
  return writeFullName(magistrat, ({ firstName, lastName }) => `${lastName} ${firstName}`);
}

// the used name is exposed only when it tells something the full name does not
export function magistratUsedName(magistrat: {
  lastName: string;
  marriedName: string | null;
  usedName: string | null;
}): string | null {
  const usedName = magistrat.usedName && upperName(magistrat.usedName);
  if (!usedName || usedName === upperName(magistrat.lastName)) return null;
  return magistrat.marriedName && usedName === upperName(magistrat.marriedName) ? null : usedName;
}

const TITLES: Record<Civility, string> = { 'M.': 'M.', MME: 'Mme' };

function isCivility(civility: string): civility is Civility {
  return Object.hasOwn(TITLES, civility);
}

// LOLFI sends the civility as free text: an unexpected one is left out rather than blocking the display
function withCivility(civility: string, name: string): string {
  return isCivility(civility) ? `${TITLES[civility]}\u00A0${name}` : name;
}

// the civility, the last name and the first name stay on the same line in a heading
export function magistratTitledFullName(magistrat: MagistratNames & { civility: string }): string {
  const fullName = writeFullName(magistrat, ({ firstName, lastName }) => `${lastName}\u00A0${firstName}`);
  return withCivility(magistrat.civility, fullName);
}

/** the name printed in session documents (agenda, official report, presentation plan), first name first */
export function magistratDocumentName(magistrat: MagistratNames & { civility: string }): string {
  const name = writeFullName(magistrat, ({ firstName, lastName }) => `${firstName}\u00A0${lastName}`);
  return withCivility(magistrat.civility, name);
}

export function proposedMagistratName(nominationFile: {
  detectedMagistrat: MagistratNames | null;
  name: string;
}): string {
  return nominationFile.detectedMagistrat
    ? magistratFullName(nominationFile.detectedMagistrat)
    : nominationFile.name;
}
