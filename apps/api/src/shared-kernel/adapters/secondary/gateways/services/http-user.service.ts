import {
  IdentityAndAccessRestContract,
  Magistrat,
  UserRestContract,
} from 'shared-models';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';
export class HttpUserService implements UserService {
  constructor(
    private readonly httpClient: BoundedContextHttpClient<IdentityAndAccessRestContract>,
    private readonly httpUser: BoundedContextHttpClient<UserRestContract>,
  ) {}

  async userWithId(userId: string) {
    return this.httpClient.fetch<'userWithId'>({
      method: 'GET',
      path: 'user-with-id/:userId',
      params: { userId },
    });
  }

  async userWithFullName(fullName: string) {
    return this.httpClient.fetch<'userWithFullName'>({
      method: 'GET',
      path: 'user-with-full-name/:fullName',
      params: { fullName },
    });
  }

  async usersByFormation(formation: Magistrat.Formation) {
    return this.httpUser.fetch<'usersByFormation'>({
      method: 'GET',
      path: 'by-formation/:formation',
      params: { formation },
    });
  }
}
