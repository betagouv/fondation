import { IdentityAndAccessRestContract } from 'shared-models';
import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';
export class HttpUserService implements UserService {
  constructor(
    private readonly httpClient: BoundedContextHttpClient<IdentityAndAccessRestContract>,
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
}
