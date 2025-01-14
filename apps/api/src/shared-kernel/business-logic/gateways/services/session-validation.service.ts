import { join } from 'node:path/posix';
import { IdentityAndAccessRestContract } from 'shared-models';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { IControllerPaths } from '../../../adapters/primary/nestjs/controller';

export const baseRoute: IdentityAndAccessRestContract['basePath'] = 'api/auth';
export const endpointsPaths: Pick<
  IControllerPaths<IdentityAndAccessRestContract>,
  'validateSession'
> = {
  validateSession: 'validate-session',
};

export class SessionValidationService {
  constructor(private readonly apiConfig: ApiConfig) {}

  async validateSession(signedSessionId: string): Promise<boolean> {
    const url = new URL(
      this.apiConfig.contextServices.identityAndAccessContext.baseUrl,
    );
    url.pathname = join(baseRoute, endpointsPaths.validateSession);
    const response = await fetch(url.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: signedSessionId }),
    });
    console.log('response', signedSessionId, response);

    if (!response.ok) {
      return false;
    }

    const responseData = await response.text();
    return !!responseData;
  }
}
