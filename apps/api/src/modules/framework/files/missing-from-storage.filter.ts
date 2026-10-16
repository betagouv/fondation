import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { FileMissingFromStorage } from './missing-from-storage';

// "Ouvrir" navigates a new tab straight to the file: the browser shows this page, not the client
const MISSING_ATTACHMENT_PAGE = `<!doctype html>
<html lang="fr" style="color-scheme: light dark">
  <head>
    <meta charset="utf-8" />
    <title>Pièce jointe introuvable</title>
  </head>
  <body style="background: Canvas; margin: 0">
    <p style="color: CanvasText; font-family: system-ui, sans-serif; margin: 2rem">
      Cette pièce jointe est introuvable. Prévenez le support.
    </p>
  </body>
</html>`;

@Catch(FileMissingFromStorage)
export class MissingFromStorageFilter implements ExceptionFilter {
  private readonly logger = new Logger(MissingFromStorageFilter.name);

  catch(_exception: FileMissingFromStorage, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    this.logger.warn(`${http.getRequest<ExpressRequest>().path} - 404`);

    http.getResponse<ExpressResponse>().status(404).type('html').send(MISSING_ATTACHMENT_PAGE);
  }
}
