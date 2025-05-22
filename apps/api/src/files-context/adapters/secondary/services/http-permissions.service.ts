import {
  IdentityAndAccessAuthzRestContract,
  interpolateUrlParams,
} from 'shared-models';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { PermissionsService } from 'src/files-context/business-logic/services/permissions.service';
import { systemRequestHeaderKey } from 'src/shared-kernel/adapters/primary/systemRequestHeaderKey';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { z } from 'zod';

type Endpoints = IdentityAndAccessAuthzRestContract['endpoints'];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], 'response'>;
};

const basePath: IdentityAndAccessAuthzRestContract['basePath'] = 'api/authz';

export class HttpPermissionsService implements PermissionsService {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly systemRequestSignatureProvider: SystemRequestSignatureProvider,
  ) {}

  async userCanRead({
    userId,
    fileId,
  }: {
    userId: string;
    fileId: string;
  }): Promise<boolean> {
    const { method, path, params }: ClientFetchOptions['userCanReadFile'] = {
      method: 'GET',
      path: 'user/:userId/can-read-file/:fileId',
      params: { userId, fileId },
    };

    try {
      const response = await this.fetchPermission(method, path, params);
      const jsonResp = await response.json();
      return z.boolean().parse(jsonResp);
    } catch (error) {
      throw new Error(`Failed to check permissions: ${error.message}`);
    }
  }

  private fetchPermission(
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
    const url = new URL(
      this.apiConfig.contextServices.identityAndAccessContext?.baseUrl,
    );
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
