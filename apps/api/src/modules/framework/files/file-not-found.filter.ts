import { Catch, NotFoundException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';

// "Ouvrir" navigates a new tab straight to the file: the browser shows this page, not the client
const PAGE = `<!doctype html>
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

@Catch(NotFoundException)
export class FileNotFoundFilter implements ExceptionFilter {
  catch(_exception: NotFoundException, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<ExpressResponse>().status(404).type('html').send(PAGE);
  }
}
