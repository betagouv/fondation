import { capitalize } from './string.utils';

export function toFullName(user: { firstName: string; lastName: string; usedName?: string | null }) {
  return `${capitalize(user.firstName.toLowerCase())} ${(user.usedName?.trim() || user.lastName.trim()).toUpperCase()}`;
}
