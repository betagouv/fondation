import { Readable } from 'node:stream';

import { HttpService } from '@nestjs/axios';
import { AXIOS_INSTANCE_TOKEN } from '@nestjs/axios/dist/http.constants';
import { DynamicModule, Inject, Injectable, Logger, Module } from '@nestjs/common';
import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { type Observable } from 'rxjs';

import * as time from '../../utils/time';

const INTERNAL_HTTP_SERVICE = Symbol();
const RETRIES = 3;
const MAX_RETRY_DELAY = 5 * time.SECONDS;
const IDEMPOTENT_METHODS = ['get', 'head', 'options', 'put', 'delete'];
// Failures a second attempt may get past, unlike an unknown host, an invalid certificate, a timeout or a cancel
const TRANSIENT_ERROR_CODES = ['EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'];

// Logs never get the query, which may carry a token
export function loggableUrl(url: string | undefined): string | undefined {
  return url?.split('?')[0];
}

function isRetryable(error: unknown, config: InternalAxiosRequestConfig): boolean {
  // Only an idempotent method is sent again: the server may have handled a POST before the connection dropped
  if (!IDEMPOTENT_METHODS.includes(config.method ?? '') || !axios.isAxiosError(error)) return false;
  if (!error.response) return TRANSIENT_ERROR_CODES.includes(error.code ?? '');

  return error.response.status === 429 || error.response.status >= 500;
}

// Retry-After holds either a number of seconds or an HTTP date
function retryAfter(error: unknown): number {
  const header = axios.isAxiosError(error) ? error.response?.headers['retry-after'] : undefined;
  if (!header) return 0;
  const delay = Number.isNaN(Number(header))
    ? Date.parse(String(header)) - Date.now()
    : Number(header) * time.SECONDS;

  return Number.isNaN(delay) ? 0 : Math.max(0, delay);
}

// The streamed body of a refused answer holds its socket until it is read: one nobody reads is let go
export function discardResponseBody(error: unknown): void {
  const data: unknown = axios.isAxiosError(error) ? error.response?.data : undefined;
  if (data instanceof Readable) data.destroy();
}

// Retries inside the adapter, so the request and its interceptors stay the same across attempts
export function retryFailedRequests(instance: AxiosInstance): void {
  const adapter = axios.getAdapter(instance.defaults.adapter);
  instance.defaults.adapter = async (config) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await adapter(config);
      } catch (error) {
        const delay = retryAfter(error);
        // A server asking for a longer pause gets its answer passed on rather than a request held that long
        if (attempt === RETRIES || !isRetryable(error, config) || delay > MAX_RETRY_DELAY) throw error;
        discardResponseBody(error);
        // The global timer, unlike node:timers/promises, is the one the tests can fake
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };
}

@Injectable()
class LoggingHttpService implements Required<HttpService> {
  private readonly logger = new Logger(HttpService.name);

  constructor(@Inject(INTERNAL_HTTP_SERVICE) private readonly http: HttpService) {}

  get axiosRef() {
    return this.http.axiosRef;
  }

  delete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, method: 'delete', url });
  }

  get<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, method: 'get', url });
  }

  head<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, method: 'head', url });
  }

  patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, data, method: 'patch', url });
  }

  post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, data, method: 'post', url });
  }

  put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...config, data, method: 'put', url });
  }

  patchForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request(this.toMultipart({ ...config, url, data, method: 'patch' }));
  }

  postForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request(this.toMultipart({ ...config, url, data, method: 'post' }));
  }

  putForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request(this.toMultipart({ ...config, url, data, method: 'put' }));
  }

  request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    this.logger.debug(`${config.method} ${loggableUrl(config.url)}`);
    return this.http.request(config);
  }

  private toMultipart(config: AxiosRequestConfig): AxiosRequestConfig {
    let headers = config?.headers;
    if (headers instanceof AxiosHeaders) {
      headers.set('content-type', 'multipart/form-data');
    } else if (headers != undefined) {
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    return { ...config, headers };
  }
}

@Module({})
class HttpModule {
  static register(): DynamicModule {
    return {
      module: HttpModule,
      global: true,
      exports: [HttpService],
      providers: [
        { provide: INTERNAL_HTTP_SERVICE, useClass: HttpService },
        { provide: HttpService, useClass: LoggingHttpService },
        {
          provide: AXIOS_INSTANCE_TOKEN,
          useFactory(): AxiosInstance {
            const instance = axios.create();
            retryFailedRequests(instance);

            return instance;
          },
        },
      ],
    };
  }
}

export { HttpModule, HttpService };
