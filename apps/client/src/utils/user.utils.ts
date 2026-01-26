import { capitalize } from './string.utils';

export function toFullName(user: { firstName: string; lastName: string }) {
  return `${capitalize(user.firstName)} ${user.lastName.toUpperCase()}`;
}
