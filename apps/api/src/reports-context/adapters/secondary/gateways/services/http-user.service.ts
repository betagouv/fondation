import {
  IdentityAndAccessRestContract,
  interpolateUrlParams,
} from 'shared-models';
import { UserDescriptorSerialized } from 'src/identity-and-access-context/business-logic/models/user-descriptor';
import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

type Endpoints = IdentityAndAccessRestContract['endpoints'];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], 'response'>;
};

const basePath: IdentityAndAccessRestContract['basePath'] = 'api/auth';

export class HttpUserService implements UserService {
  constructor(private readonly apiConfig: ApiConfig) {}

  async userWithFullName(fullName: string): Promise<UserDescriptorSerialized> {
    const { method, path, params }: ClientFetchOptions['userWithFullName'] = {
      method: 'GET',
      path: 'user-with-full-name/:fullName',
      params: { fullName },
    };

    const url = this.resolveUrl(path, params);

    const response = await this.fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const userDescriptor = await response.json();

    if (!userDescriptor) {
      throw new Error(`User with name ${fullName} not found`);
    }
    return userDescriptor as UserDescriptorSerialized;
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(this.apiConfig.contextServices.filesContext.baseUrl);
    url.pathname = fullPath;

    if (!params) return url.href;
    return encodeURI(interpolateUrlParams(url, params));
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
