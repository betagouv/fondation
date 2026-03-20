import { Role } from 'shared-models';
import {
  IncompatibleDuty,
  IncompatibleTitle,
  User,
  UserDisplayTitleUpdated,
  UserDutyUpdated,
  UserEmailUpdated,
  UserRoleUpdated,
  UserTitleUpdated,
} from './user';
import { UserDuty, UserTitle } from './user-enum';

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
      const user = User.from({
        ...baseProps,
        title: null,
        role: Role.MEMBRE_COMMUN,
      });

      user.updateTitle('PRESIDENT_SIEGE');
      expect(user.messages).toContainEqual(
        new UserTitleUpdated(user.id, 'PRESIDENT_SIEGE'),
      );

      expect(user.messages).toContainEqual(
        new UserDutyUpdated(user.id, 'PRESIDENT'),
      );
    });

    it('emits UserTitleUpdated with duty=PRESIDENT when title is PRESIDENT_PARQUET', () => {
      const user = User.from({
        ...baseProps,
        title: null,
        role: Role.MEMBRE_COMMUN,
      });

      user.updateTitle('PRESIDENT_PARQUET');
      expect(user.messages).toContainEqual(
        new UserTitleUpdated(user.id, 'PRESIDENT_PARQUET'),
      );

      expect(user.messages).toContainEqual(
        new UserDutyUpdated(user.id, 'PRESIDENT'),
      );
    });

    it.each`
      role                               | title
      ${Role.MEMBRE_DU_PARQUET}          | ${'PRESIDENT_SIEGE' satisfies UserTitle}
      ${Role.MEMBRE_DU_SIEGE}            | ${'PRESIDENT_PARQUET' satisfies UserTitle}
      ${Role.ADMIN}                      | ${'PRESIDENT_SIEGE' satisfies UserTitle}
      ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${'PRESIDENT_SIEGE' satisfies UserTitle}
      ${Role.ADMIN}                      | ${'PRESIDENT_PARQUET' satisfies UserTitle}
      ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${'PRESIDENT_PARQUET' satisfies UserTitle}
      ${Role.MEMBRE_COMMUN}              | ${'FIRST_SECRETARY' satisfies UserTitle}
    `(
      `should throw, when assigning $title to a $role user`,
      ({ role, title }: { role: Role; title: UserTitle }) => {
        const user = User.from({
          ...baseProps,
          role,
          title: null,
        });

        expect(() => user.updateTitle(title)).toThrow(
          new IncompatibleTitle(title),
        );
      },
    );

    it('emits UserTitleUpdated with duty=SECRETARY when title is FIRST_SECRETARY', () => {
      const user = User.from({
        ...baseProps,
        title: null,
        role: Role.ADJOINT_SECRETAIRE_GENERAL,
      });

      user.updateTitle('FIRST_SECRETARY');
      expect(user.messages).toContainEqual(
        new UserTitleUpdated(user.id, 'FIRST_SECRETARY'),
      );

      expect(user.messages).toContainEqual(
        new UserDutyUpdated(user.id, 'SECRETARY'),
      );
    });

    it('emits UserTitleUpdated with null title and null duty when clearing title', () => {
      const user = User.from(baseProps);

      user.updateTitle(null);
      expect(user.messages).toContainEqual(new UserTitleUpdated(user.id, null));
      expect(user.messages).not.toContainEqual(expect.any(UserDutyUpdated));
    });
  });

  describe('updateDuty', () => {
    it('emits UserDutyUpdated with the given duty', () => {
      const user = User.from(baseProps);
      user.updateDuty('OFFICER');

      expect(user.messages).toContainEqual(
        new UserDutyUpdated(user.id, 'OFFICER'),
      );
    });

    it('emits UserDutyUpdated with null when clearing duty', () => {
      const user = User.from(baseProps);
      user.updateDuty(null);

      expect(user.messages).toContainEqual(new UserDutyUpdated(user.id, null));
    });

    it.each`
      role                               | duty
      ${Role.ADMIN}                      | ${'PRESIDENT' satisfies UserDuty}
      ${Role.ADJOINT_SECRETAIRE_GENERAL} | ${'PRESIDENT' satisfies UserDuty}
      ${Role.MEMBRE_DU_SIEGE}            | ${'SECRETARY' satisfies UserDuty}
      ${Role.MEMBRE_DU_PARQUET}          | ${'SECRETARY' satisfies UserDuty}
      ${Role.MEMBRE_COMMUN}              | ${'SECRETARY' satisfies UserDuty}
      ${Role.MEMBRE_DU_SIEGE}            | ${'OFFICER' satisfies UserDuty}
      ${Role.MEMBRE_DU_PARQUET}          | ${'OFFICER' satisfies UserDuty}
      ${Role.MEMBRE_COMMUN}              | ${'OFFICER' satisfies UserDuty}
    `(
      `should throw, when assigning $duty to a $role user`,
      ({ role, duty }: { role: Role; duty: UserDuty }) => {
        const user = User.from({
          ...baseProps,
          role,
          duty: null,
          title: null,
        });

        expect(() => user.updateDuty(duty)).toThrow(new IncompatibleDuty(duty));
      },
    );
  });

  describe('updateEmail', () => {
    it('emits UserEmailUpdated with the new email', () => {
      const user = User.from(baseProps);
      user.updateEmail('new@email.com');

      expect(user.messages).toContainEqual(
        new UserEmailUpdated(user.id, 'new@email.com'),
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

    it('should reset title, when new role is incompatible', () => {
      const user = User.from({
        ...baseProps,
        role: Role.MEMBRE_COMMUN,
        title: 'PRESIDENT_PARQUET',
      });

      user.updateRole(Role.MEMBRE_DU_SIEGE);

      expect(user.messages).toContainEqual(new UserTitleUpdated(user.id, null));
      expect(user.messages).toContainEqual(new UserDutyUpdated(user.id, null));
    });

    it('should reset duty, when new role is incompatible', () => {
      const user = User.from({ ...baseProps, duty: 'PRESIDENT' });

      user.updateRole(Role.ADJOINT_SECRETAIRE_GENERAL);

      expect(user.messages).toContainEqual(new UserDutyUpdated(user.id, null));
    });
  });

  describe('updateDisplayTitle', () => {
    it('emits UserDisplayTitleUpdated with the value', () => {
      const user = User.from(baseProps);
      user.updateDisplayTitle('Conseiller référendaire');
      expect(user.messages).toContainEqual(
        new UserDisplayTitleUpdated(user.id, 'Conseiller référendaire'),
      );
    });
  });
});
