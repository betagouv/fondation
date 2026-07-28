import { HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Clock } from '../clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../config';

import { GotenbergHttpClient } from './gotenberg-http-client.service';
import { GotenbergPdfRenderer } from './gotenberg-pdf-renderer.service';
import { PdfRenderer } from './pdf-renderer.service';
import { PuppeteerPdfRenderer } from './puppeteer-pdf-renderer.service';

@Module({
  exports: [PdfRenderer],
  providers: [
    {
      provide: GotenbergHttpClient,
      inject: [Clock, HttpService, API_CONFIG_TOKEN],
      useFactory: (clock: Clock, http: HttpService, config: ApiConfig) =>
        config.gotenberg.apiUrl
          ? new GotenbergHttpClient(clock, http, new URL(config.gotenberg.apiUrl))
          : undefined,
    },
    GotenbergPdfRenderer,
    PuppeteerPdfRenderer,
    PdfRenderer,
  ],
})
export class PdfModule {}
