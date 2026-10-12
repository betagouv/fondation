import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { describeErrorWithoutSecrets } from './describe-error-without-secrets';

describe('describeErrorWithoutSecrets', () => {
  it('should keep neither the credentials nor the URL of an HTTP error', () => {
    const config = {
      auth: { password: 'fake-credential', username: '' },
      headers: new AxiosHeaders({ Authorization: 'fake-authorization' }),
      method: 'post',
      url: 'https://webhooks.example/fake-path',
    } satisfies InternalAxiosRequestConfig;
    const error = new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config);

    const description = describeErrorWithoutSecrets(error);

    expect(description).toBe('AxiosError: Request failed with status code 401');
    expect(description).not.toMatch(/fake/);
  });

  it('should keep the whole detail of any other error', () => {
    const description = describeErrorWithoutSecrets(new Error('archive is corrupted'));

    expect(description).toContain('archive is corrupted');
    expect(description).toContain('describe-error-without-secrets.spec.ts');
  });
});
