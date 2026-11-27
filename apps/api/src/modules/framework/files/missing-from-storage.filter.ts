import { Catch, Optional, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { WideEvent } from '../wide-event';

import { FileMissingFromStorage } from './missing-from-storage';

// "Ouvrir" navigates a new tab straight to the file: the browser shows this page, not the client.
// The API CSP blocks any style: the color-scheme meta alone keeps the dark mode
const MISSING_ATTACHMENT_PAGE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light dark" />
    <title>Pièce jointe introuvable</title>
  </head>
  <body>
    <p>Cette pièce jointe est introuvable. Prévenez le support.</p>
  </body>
</html>`;

@Catch(FileMissingFromStorage)
export class MissingFromStorageFilter implements ExceptionFilter {
  constructor(@Optional() private readonly wideEvent?: WideEvent) {}

  catch(exception: FileMissingFromStorage, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<ExpressRequest>();
    this.wideEvent?.failWith(exception, request);

    http.getResponse<ExpressResponse>().status(404).type('html').send(MISSING_ATTACHMENT_PAGE);
  }
}
