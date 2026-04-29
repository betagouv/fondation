import { faker } from '@faker-js/faker/locale/fr';
import type { RegisteredUserDto, RegisterUserDto } from '../../src/generated/api/types';
import type { HttpClient } from './http-client.fixture';

export type UserRole = NonNullable<RegisterUserDto['role']>;
export type RegisteredUser<Role extends UserRole = UserRole> = Omit<RegisterUserDto, 'role'> & {
  id: string;
  role: Role;
};

export class AuthHttpClient {
  constructor(private readonly http: HttpClient) {}

  async registerUser<const Role extends UserRole>(options: {
    defaultUser?: Partial<Omit<RegisterUserDto, 'role'>>;
    role: Role;
  }): Promise<RegisteredUser<Role>> {
    const { role, defaultUser } = options;
    const person = {
      email: (defaultUser?.email || `test_email+e2e-${crypto.randomUUID()}-e2e@justice.fr`).toLowerCase(),
      firstName: (defaultUser?.firstName || faker.person.firstName()).toLowerCase(),
      lastName: (defaultUser?.lastName || faker.person.lastName()).toLowerCase(),
      password: defaultUser?.password || faker.string.alphanumeric(20),
      gender: defaultUser?.gender ?? ('FEMALE' as const)
    };

    const response = await this.http.request({
      url: '/api/auth/v2/register',
      data: { ...person, role }
    });

    const { id }: RegisteredUserDto = await response.json();
    return { ...person, role: (role ?? 'MEMBRE_COMMUN') as Role, id };
  }
}
