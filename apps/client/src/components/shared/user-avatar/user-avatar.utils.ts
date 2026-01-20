import { capitalize } from '@/utils/string.utils';

export const userAvatarSizes = {
  sm: 'size-6 leading-6 text-xs',
  md: 'size-8 leading-8 text-sm',
  lg: 'size-10 leading-10 text-base'
} as const;

export function toFullName(user: { firstName: string; lastName: string }) {
  return `${capitalize(user.firstName)} ${user.lastName.toUpperCase()}`;
}
