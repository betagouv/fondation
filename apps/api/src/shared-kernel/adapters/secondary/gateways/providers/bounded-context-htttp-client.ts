import {
  FilesContextRestContract,
  IdentityAndAccessAuthzRestContract,
  IdentityAndAccessRestContract,
  interpolateUrlParams,
  NominationsContextRestContract,
  ReportsContextRestContract,
  RestContract,
} from 'shared-models';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { systemRequestHeaderKey } from 'src/shared-kernel/adapters/primary/systemRequestHeaderKey';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

type BasePath =
  | IdentityAndAccessRestContract['basePath']
  | ReportsContextRestContract['basePath']
  | FilesContextRestContract['basePath']
  | IdentityAndAccessAuthzRestContract['basePath']
  | NominationsContextRestContract['basePath'];

type ClientFetchOptions<C extends RestContract> = {
  [K in keyof C['endpoints']]: Omit<C['endpoints'][K], 'response'>;
};

export class BoundedContextHttpClient<Contract extends RestContract> {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly systemRequestSignatureProvider: SystemRequestSignatureProvider,
    private readonly basePath: BasePath,
  ) {}

  async fetch<P extends keyof Contract['endpoints']>(
    endpointFetchOptions: ClientFetchOptions<Contract>[P],
  ): Promise<Contract['endpoints'][P]['response']> {
    const url = this.resolveUrl(
      endpointFetchOptions.path,
      endpointFetchOptions.params,
    );

    const resp = await this._fetch(url, {
      method: endpointFetchOptions.method,
    });
    return (await resp.json()) as Contract['endpoints'][P]['response'];
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    const fullPath = `${this.basePath}/${path}`;
    const url = new URL(this.apiConfig.contextServices.filesContext.baseUrl);
    url.pathname = fullPath;

    if (!params) return url.href;
    return encodeURI(interpolateUrlParams(url, params));
  }

  private async _fetch(url: string, requestInit: RequestInit) {
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
