import {
  IdentityAndAccessRestContract,
  interpolateUrlParams,
} from 'shared-models';
import { UserService } from 'src/data-administration-context/transparences/business-logic/gateways/services/user.service';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { systemRequestHeaderKey } from 'src/shared-kernel/adapters/primary/systemRequestHeaderKey';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

type Endpoints = IdentityAndAccessRestContract['endpoints'];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], 'response'>;
};

const basePath: IdentityAndAccessRestContract['basePath'] = 'api/auth';

export class HttpUserService implements UserService {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly systemRequestSignatureProvider: SystemRequestSignatureProvider,
  ) {}

  async userWithId(userId: string): Promise<UserDescriptorSerialized> {
    const { method, path, params }: ClientFetchOptions['userWithId'] = {
      method: 'GET',
      path: 'user-with-id/:userId',
      params: { userId },
    };

    const response = await this.fetchUser(method, path, params);

    return this.userDescriptorFromResponse<Endpoints['userWithId']['response']>(
      response,
      `User with id ${userId} not found`,
    );
  }

  async userWithFullName(fullName: string): Promise<UserDescriptorSerialized> {
    const { method, path, params }: ClientFetchOptions['userWithFullName'] = {
      method: 'GET',
      path: 'user-with-full-name/:fullName',
      params: { fullName },
    };

    const response = await this.fetchUser(method, path, params);

    return this.userDescriptorFromResponse<
      Endpoints['userWithFullName']['response']
    >(response, `User with name ${fullName} not found`);
  }

  private async userDescriptorFromResponse<R>(
    response: Response,
    errorMessage: string,
  ) {
    try {
      return (await response.json()) as R;
    } catch (error) {
      throw new Error(errorMessage, error.originalError);
    }
  }

  private fetchUser(
    method: string,
    path: string,
    params?: Record<string, string>,
  ) {
    const url = this.resolveUrl(path, params);

    return this.fetch(url, {
      method,
    });
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(this.apiConfig.contextServices.filesContext.baseUrl);
    url.pathname = fullPath;

    if (!params) return url.href;
    return encodeURI(interpolateUrlParams(url, params));
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        [systemRequestHeaderKey]: this.systemRequestSignatureProvider.sign(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }
}
