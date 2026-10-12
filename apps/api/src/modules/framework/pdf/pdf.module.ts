import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from '../config';

import { GotenbergHttpClient } from './gotenberg-http-client.service';
import { PdfRenderer } from './pdf-renderer.service';

@Module({
  exports: [PdfRenderer],
  providers: [
    {
      provide: GotenbergHttpClient,
      inject: [HttpService, API_CONFIG_TOKEN],
      useFactory: (http: HttpService, config: ApiConfig) =>
        new GotenbergHttpClient(http, new URL(config.gotenberg.apiUrl)),
    },
    PdfRenderer,
  ],
})
export class PdfModule {}
