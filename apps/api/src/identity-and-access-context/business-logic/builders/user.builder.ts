import _ from 'lodash';
import { Get, Paths } from 'type-fest';
import { Role } from 'shared-models';
import { UserSnapshot } from '../models/user';
import { RegisterUserCommand } from '../use-cases/user-registration/register-user.use-case';
import { Gender } from '../models/gender';

export class UserBuilder {
  private _snapshot: UserSnapshot;

  constructor(
    idMode: 'fake' | 'uuid' = 'fake',
    override?: Partial<UserSnapshot>,
  ) {
    const isFakeId = idMode === 'fake';

    this._snapshot = {
      id: isFakeId ? 'user-id' : 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      createdAt: new Date(2021, 1, 1),
      email: 'user@example.fr',
      password: 'password',
      role: Role.MEMBRE_DU_SIEGE,
      firstName: 'john',
      lastName: 'doe',
      gender: Gender.F,
      ...override,
    };
  }

  with<
    K extends Paths<UserSnapshot>,
    V extends Get<UserSnapshot, K> = Get<UserSnapshot, K>,
  >(property: K, value: V) {
    this._snapshot = _.set(this._snapshot, property, value);
    return this;
  }

  build(): UserSnapshot {
    return this._snapshot;
  }

  buildRegisterUserCommand(): RegisterUserCommand {
    return {
      email: this._snapshot.email,
      password: this._snapshot.password,
      role: this._snapshot.role,
      firstName: this._snapshot.firstName,
      lastName: this._snapshot.lastName,
      gender: this._snapshot.gender,
    };
  }
}
