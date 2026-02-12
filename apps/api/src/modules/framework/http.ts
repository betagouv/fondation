import { HttpService } from '@nestjs/axios';
import { AXIOS_INSTANCE_TOKEN } from '@nestjs/axios/dist/http.constants';
import { DynamicModule, Module } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import retry from 'axios-retry';

@Module({})
class HttpModule {
  static register(): DynamicModule {
    return {
      module: HttpModule,
      global: true,
      exports: [HttpService],
      providers: [
        HttpService,
        {
          provide: AXIOS_INSTANCE_TOKEN,
          useFactory(): AxiosInstance {
            const instance = axios.create();
            retry(instance, {
              onRetry(count) {
                console.log('retry', count);
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
