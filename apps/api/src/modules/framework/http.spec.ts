import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { loggableUrl, retryFailedRequests } from './http';

describe('loggableUrl', () => {
  it.each`
    url                                                         | expected
    ${'https://auth.scalingo.com/v1/tokens/exchange?token=abc'} | ${'https://auth.scalingo.com/v1/tokens/exchange'}
    ${'http://localhost:9091/forms/chromium/convert/html'}      | ${'http://localhost:9091/forms/chromium/convert/html'}
  `('should log "$url" as "$expected"', ({ url, expected }) => {
    expect(loggableUrl(url)).toBe(expected);
  });
});

describe('retryFailedRequests', () => {
  const networkError = (config: InternalAxiosRequestConfig) =>
    new AxiosError('socket hang up', 'ECONNRESET', config);
  const statusError = (status: number) => (config: InternalAxiosRequestConfig) =>
    new AxiosError('failed', 'ERR_BAD_RESPONSE', config, undefined, { status } as AxiosResponse);

  function clientFailingWith(failure: (config: InternalAxiosRequestConfig) => AxiosError, failures: number) {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (adapter.mock.calls.length <= failures) throw failure(config);
      return { config, data: 'ok', headers: {}, status: 200, statusText: 'OK' };
    });
    const instance = axios.create({ adapter });
    retryFailedRequests(instance);

    return { adapter, instance };
  }

  it('should retry a request that got no response until it succeeds', async () => {
    const { adapter, instance } = clientFailingWith(networkError, 2);

    const { data } = await instance.get('http://example.test');

    expect(data).toBe('ok');
    expect(adapter).toHaveBeenCalledTimes(3);
  });

  it('should give up after three retries', async () => {
    const { adapter, instance } = clientFailingWith(networkError, 10);

    await expect(instance.get('http://example.test')).rejects.toThrow('socket hang up');
    expect(adapter).toHaveBeenCalledTimes(4);
  });

  it('should retry a server error on an idempotent method', async () => {
    const { adapter, instance } = clientFailingWith(statusError(503), 1);

    await instance.put('http://example.test', {});

    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it.each([400, 404, 429])('should not retry a %i', async (status) => {
    const { adapter, instance } = clientFailingWith(statusError(status), 1);

    await expect(instance.get('http://example.test')).rejects.toThrow('failed');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it.each`
    failure             | message
    ${networkError}     | ${'socket hang up'}
    ${statusError(503)} | ${'failed'}
  `('should never send a POST twice, even after "$message"', async ({ failure, message }) => {
    const { adapter, instance } = clientFailingWith(failure, 1);

    await expect(instance.post('http://example.test', {})).rejects.toThrow(message);
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
