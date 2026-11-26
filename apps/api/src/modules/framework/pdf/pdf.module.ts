import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from '../config';
import { WideEvent } from '../wide-event';

import { GotenbergHttpClient } from './gotenberg-http-client.service';
import { PdfRenderer } from './pdf-renderer.service';

@Module({
  exports: [PdfRenderer],
  providers: [
    {
      provide: GotenbergHttpClient,
      inject: [HttpService, API_CONFIG_TOKEN, WideEvent],
      useFactory: (http: HttpService, config: ApiConfig, wideEvent: WideEvent) =>
        new GotenbergHttpClient(http, new URL(config.gotenberg.apiUrl), wideEvent),
    },
    PdfRenderer,
  ],
})
export class PdfModule {}
