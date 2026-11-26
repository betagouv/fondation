import { Readable } from 'node:stream';

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
  const networkError = (code: string) => (config: InternalAxiosRequestConfig) =>
    new AxiosError(code, code, config);
  // Axios tags a 4xx ERR_BAD_REQUEST and a 5xx ERR_BAD_RESPONSE
  const statusError =
    (status: number, headers: Record<string, string> = {}) =>
    (config: InternalAxiosRequestConfig) =>
      new AxiosError('failed', status < 500 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE', config, undefined, {
        headers,
        status,
      } as AxiosResponse);

  function clientFailingWith(failure: (config: InternalAxiosRequestConfig) => AxiosError, failures: number) {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (adapter.mock.calls.length <= failures) throw failure(config);
      return { config, data: 'ok', headers: {}, status: 200, statusText: 'OK' };
    });
    const instance = axios.create({ adapter });
    retryFailedRequests(instance);

    return { adapter, instance };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should retry a dropped connection until it succeeds', async () => {
    const { adapter, instance } = clientFailingWith(networkError('ECONNRESET'), 2);

    const { data } = await instance.get('http://example.test');

    expect(data).toBe('ok');
    expect(adapter).toHaveBeenCalledTimes(3);
  });

  it('should give up after three retries', async () => {
    const { adapter, instance } = clientFailingWith(networkError('ECONNRESET'), 10);

    await expect(instance.get('http://example.test')).rejects.toThrow('ECONNRESET');
    expect(adapter).toHaveBeenCalledTimes(4);
  });

  it.each(['ENOTFOUND', 'CERT_HAS_EXPIRED', 'ECONNABORTED', 'ERR_CANCELED'])(
    'should not retry a request that failed with %s',
    async (code) => {
      const { adapter, instance } = clientFailingWith(networkError(code), 1);

      await expect(instance.get('http://example.test')).rejects.toThrow(code);
      expect(adapter).toHaveBeenCalledTimes(1);
    },
  );

  it('should retry a server error on an idempotent method', async () => {
    const { adapter, instance } = clientFailingWith(statusError(503), 1);

    await instance.put('http://example.test', {});

    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('should let go the streamed body of the answer it retries, which would hold its socket', async () => {
    const body = Readable.from(['unavailable']);
    const { instance } = clientFailingWith(
      (config) =>
        new AxiosError('failed', 'ERR_BAD_RESPONSE', config, undefined, {
          data: body,
          headers: {},
          status: 503,
        } as AxiosResponse),
      1,
    );

    await instance.get('http://example.test', { responseType: 'stream' });

    expect(body.destroyed).toBe(true);
  });

  it('should wait the delay a rate limiting server asks for before retrying', async () => {
    vi.useFakeTimers();
    const { adapter, instance } = clientFailingWith(statusError(429, { 'retry-after': '2' }), 1);

    const response = instance.put('http://example.test', {});
    await vi.advanceTimersByTimeAsync(1999);
    expect(adapter).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(response).resolves.toMatchObject({ data: 'ok' });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('should give up when the server asks to wait more than five seconds', async () => {
    const { adapter, instance } = clientFailingWith(statusError(503, { 'retry-after': '6' }), 1);

    await expect(instance.get('http://example.test')).rejects.toThrow('failed');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it.each([400, 404])('should not retry a %i', async (status) => {
    const { adapter, instance } = clientFailingWith(statusError(status), 1);

    await expect(instance.get('http://example.test')).rejects.toThrow('failed');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it.each`
    failure                       | message
    ${networkError('ECONNRESET')} | ${'ECONNRESET'}
    ${statusError(503)}           | ${'failed'}
  `('should never send a POST twice, even after "$message"', async ({ failure, message }) => {
    const { adapter, instance } = clientFailingWith(failure, 1);

    await expect(instance.post('http://example.test', {})).rejects.toThrow(message);
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
