import { canListDeactivatedMembers } from './member-list.policy';

describe('canListDeactivatedMembers', () => {
  it('lets an admin list the deactivated members', () => {
    expect(canListDeactivatedMembers({ isAdmin: true })).toBe(true);
  });

  it('keeps them from a user who is no admin', () => {
    expect(canListDeactivatedMembers({ isAdmin: false })).toBe(false);
  });
});
