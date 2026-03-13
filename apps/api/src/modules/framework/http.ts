import { HttpService } from '@nestjs/axios';
import { AXIOS_INSTANCE_TOKEN } from '@nestjs/axios/dist/http.constants';
import {
  DynamicModule,
  Inject,
  Injectable,
  Logger,
  Module,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import retry from 'axios-retry';
import { catchError, tap, throwError, type Observable } from 'rxjs';

const INTERNAL_HTTP_SERVICE = Symbol();

/** for some reason, Sentry instrumentation doesn't trace the http.client stack */
@Injectable()
class InstrumentedHttpService implements Required<HttpService> {
  private readonly logger = new Logger(HttpService.name);
  private static readonly NOT_ALLOWED_HEADERS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-amz-server-side-encryption-customer-key',
  ]);

  constructor(
    @Inject(INTERNAL_HTTP_SERVICE) private readonly http: HttpService,
  ) {}

  get axiosRef() {
    return this.http.axiosRef;
  }

  delete<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), method: 'delete', url });
  }

  get<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), method: 'get', url });
  }

  head<T = any, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), method: 'head', url });
  }

  patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), data, method: 'patch', url });
  }

  post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), data, method: 'post', url });
  }

  put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({ ...(config ?? {}), data, method: 'put', url });
  }

  patchForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({
      ...(config ?? {}),
      url,
      data,
      method: 'patch',
      headers: {
        ...(config?.headers ?? {}),
        'content-type': 'multipart/form-data',
      },
    });
  }

  postForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({
      ...(config ?? {}),
      url,
      data,
      method: 'post',
      headers: {
        ...(config?.headers ?? {}),
        'content-type': 'multipart/form-data',
      },
    });
  }

  putForm<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Observable<AxiosResponse<T, D>> {
    return this.request({
      ...(config ?? {}),
      url,
      data,
      method: 'put',
      headers: {
        ...(config?.headers ?? {}),
        'content-type': 'multipart/form-data',
      },
    });
  }

  request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const { method, url } = config;
    this.logger.debug(`${method} ${url}`);

    return Sentry.startSpan(
      {
        op: 'http.client',
        name: `${method} ${url}`,
      },
      (span) => {
        span.setAttributes(InstrumentedHttpService.requestAttributes(config));

        return this.http.request(config).pipe(
          tap((response) => {
            span.setAttributes(
              InstrumentedHttpService.responseAttributes(response),
            );
          }),
          catchError((error) => {
            if (error instanceof AxiosError && error.response) {
              span.setAttributes(
                InstrumentedHttpService.responseAttributes(
                  error.response,
                  error,
                ),
              );
            }

            return throwError(() => error);
          }),
        );
      },
    );
  }

  private static requestAttributes(
    config: AxiosRequestConfig,
  ): Record<string, string | undefined> {
    let hostname, port;
    const { method, url } = config;
    try {
      if (url) ({ hostname, port } = new URL(url));
    } catch {}

    const output: Record<string, string | undefined> = {
      'http.request.method': method,
      'server.address': hostname ?? '',
      'server.port': port ?? '',
    };

    for (const [h, v] of Object.entries(config.headers ?? {})) {
      const _h = h.toLowerCase();
      if (InstrumentedHttpService.NOT_ALLOWED_HEADERS.has(_h)) continue;

      output['http.request.header.' + _h] = v;
      if (_h === 'content-length') {
        output['http.request.body.size'] = v;
      }
    }

    return output;
  }

  private static responseAttributes(
    response: AxiosResponse,
    error?: AxiosError,
  ): Record<string, string | undefined> {
    const output: Record<string, string | undefined> = {};

    for (const [h, v] of Object.entries(response.headers ?? {})) {
      const _h = h.toLowerCase();
      if (InstrumentedHttpService.NOT_ALLOWED_HEADERS.has(_h)) continue;

      output['http.response.header.' + _h] = v;
      if (_h === 'content-length') {
        output['http.response.body.size'] = v;
      }
    }

    if (error?.status) output['error.type'] = String(error.status);

    return output;
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
        { provide: HttpService, useClass: InstrumentedHttpService },
        {
          provide: AXIOS_INSTANCE_TOKEN,
          useFactory(): AxiosInstance {
            const instance = axios.create();
            retry(instance, {
              onRetry(count) {
                console.log('retry', count);
                Sentry.getActiveSpan()?.setAttribute(
                  'http.request.resend_count',
                  count,
                );
              },
            });

            return instance;
          },
        },
      ],
    };
  }
}

export { HttpModule, HttpService };
