import { Role } from 'shared-models';
import {
  User,
  UserDisplayTitleUpdated,
  UserDutyUpdated,
  UserEmailUpdated,
  UserRoleUpdated,
  UserTitleUpdated,
} from './user';

describe('User', () => {
  const baseProps = {
    id: 'user-1',
    email: 'test@test.com',
    role: Role.ADMIN,
    title: null,
    duty: null,
    displayTitle: null,
  };

  describe('updateTitle', () => {
    it('emits UserTitleUpdated with duty=PRESIDENT when title is PRESIDENT_SIEGE', () => {
      const user = User.from(baseProps);
      user.updateTitle('PRESIDENT_SIEGE');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserTitleUpdated);
      expect((user.messages[0] as UserTitleUpdated).title).toBe(
        'PRESIDENT_SIEGE',
      );
      expect((user.messages[0] as UserTitleUpdated).duty).toBe('PRESIDENT');
    });

    it('emits UserTitleUpdated with duty=PRESIDENT when title is PRESIDENT_PARQUET', () => {
      const user = User.from(baseProps);
      user.updateTitle('PRESIDENT_PARQUET');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserTitleUpdated);
      expect((user.messages[0] as UserTitleUpdated).title).toBe(
        'PRESIDENT_PARQUET',
      );
      expect((user.messages[0] as UserTitleUpdated).duty).toBe('PRESIDENT');
    });

    it('emits UserTitleUpdated with duty=SECRETARY when title is FIRST_SECRETARY', () => {
      const user = User.from(baseProps);
      user.updateTitle('FIRST_SECRETARY');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserTitleUpdated);
      expect((user.messages[0] as UserTitleUpdated).title).toBe(
        'FIRST_SECRETARY',
      );
      expect((user.messages[0] as UserTitleUpdated).duty).toBe('SECRETARY');
    });

    it('emits UserTitleUpdated with null title and null duty when clearing title', () => {
      const user = User.from({ ...baseProps, title: 'PRESIDENT_SIEGE' });
      user.updateTitle(null);
      expect(user.messages).toHaveLength(1);
      const msg = user.messages[0] as UserTitleUpdated;
      expect(msg.title).toBeNull();
      expect(msg.duty).toBeNull();
    });

    it('does not emit a separate UserDutyUpdated', () => {
      const user = User.from(baseProps);
      user.updateTitle('FIRST_SECRETARY');
      expect(user.messages).toHaveLength(1);
    });
  });

  describe('updateDuty', () => {
    it('emits UserDutyUpdated with the given duty', () => {
      const user = User.from(baseProps);
      user.updateDuty('OFFICER');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserDutyUpdated);
      expect((user.messages[0] as UserDutyUpdated).duty).toBe('OFFICER');
    });

    it('emits UserDutyUpdated with null when clearing duty', () => {
      const user = User.from({ ...baseProps, duty: 'PRESIDENT' });
      user.updateDuty(null);
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserDutyUpdated);
      expect((user.messages[0] as UserDutyUpdated).duty).toBeNull();
    });
  });

  describe('updateEmail', () => {
    it('emits UserEmailUpdated with the new email', () => {
      const user = User.from(baseProps);
      user.updateEmail('new@email.com');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserEmailUpdated);
      expect((user.messages[0] as UserEmailUpdated).email).toBe(
        'new@email.com',
      );
    });
  });

  describe('updateRole', () => {
    it('emits UserRoleUpdated with the new role', () => {
      const user = User.from(baseProps);
      user.updateRole(Role.MEMBRE_DU_SIEGE);
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserRoleUpdated);
      expect((user.messages[0] as UserRoleUpdated).role).toBe(
        Role.MEMBRE_DU_SIEGE,
      );
    });
  });

  describe('updateDisplayTitle', () => {
    it('emits UserDisplayTitleUpdated with the value', () => {
      const user = User.from(baseProps);
      user.updateDisplayTitle('Conseiller référendaire');
      expect(user.messages).toHaveLength(1);
      expect(user.messages[0]).toBeInstanceOf(UserDisplayTitleUpdated);
      expect((user.messages[0] as UserDisplayTitleUpdated).displayTitle).toBe(
        'Conseiller référendaire',
      );
    });
  });
});
