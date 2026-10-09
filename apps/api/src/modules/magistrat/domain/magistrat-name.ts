import { capitalize } from 'src/utils/capitalize';

type MagistratNames = { firstName: string; lastName: string; marriedName: string | null };

export function magistratFullName(magistrat: MagistratNames): string {
  const lastName = magistrat.lastName.trim().toUpperCase();
  const firstName = capitalize(magistrat.firstName.trim().toLowerCase());
  const marriedName = magistrat.marriedName?.trim().toUpperCase();
  return marriedName && marriedName !== lastName
    ? `${lastName} ${firstName} (ép. ${marriedName})`
    : `${lastName} ${firstName}`;
}

export function magistratTitledFullName(magistrat: MagistratNames & { civility: 'M.' | 'MME' }): string {
  return `${magistrat.civility === 'MME' ? 'Mme' : 'M.'} ${magistratFullName(magistrat)}`;
}
