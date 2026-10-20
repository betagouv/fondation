export const USER_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export function userStatusOf(user: { deactivatedAt: Date | null }): UserStatus {
  return user.deactivatedAt ? 'DEACTIVATED' : 'ACTIVE';
}
