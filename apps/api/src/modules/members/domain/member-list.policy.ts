export function canListDeactivatedMembers(user: { isAdmin: boolean }): boolean {
  return user.isAdmin;
}
