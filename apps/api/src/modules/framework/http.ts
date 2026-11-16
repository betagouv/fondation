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

const INTERNAL_HTTP_SERVICE = Symbol();
const RETRIES = 3;
const IDEMPOTENT_METHODS = ['get', 'head', 'options', 'put', 'delete'];

// Logs never get the query, which may carry a token
export function loggableUrl(url: string | undefined): string | undefined {
  return url?.split('?')[0];
}

// A POST is never sent twice: the server may have handled the first one before the connection dropped
function isRetryable(error: unknown, config: InternalAxiosRequestConfig): boolean {
  if (!IDEMPOTENT_METHODS.includes(config.method ?? '')) return false;
  if (!axios.isAxiosError(error) || error.code === 'ECONNABORTED' || axios.isCancel(error)) return false;

  return !error.response || error.response.status >= 500;
}

// Retries inside the adapter, so the request and its interceptors stay the same across attempts
export function retryFailedRequests(instance: AxiosInstance): void {
  const adapter = axios.getAdapter(instance.defaults.adapter);
  instance.defaults.adapter = async (config) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await adapter(config);
      } catch (error) {
        if (attempt === RETRIES || !isRetryable(error, config)) throw error;
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
