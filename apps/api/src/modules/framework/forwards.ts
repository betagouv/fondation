import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Inject,
  Module,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { lastValueFrom } from 'rxjs';
import { HasRole } from '../simple-auth';
import { API_CONFIG_TOKEN, ApiConfig } from './config';

@Controller('/api/f')
@ApiExcludeController()
export class ForwardsController {
  private readonly mattermostWebhook: string | null;
  constructor(
    @Inject(API_CONFIG_TOKEN) config: ApiConfig,
    private readonly http: HttpService,
  ) {
    this.mattermostWebhook = config.mattermostWebhook;
  }

  @Post('/m')
  @HasRole('MACHINE')
  async forwardsToMattermost(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<unknown> {
    if (!this.mattermostWebhook) {
      res.status(404).end();
      return;
    }

    /* eslint-disable */
    const {
      host: _host,
      authorization: _authorization,
      connection: _connection,
      'content-length': _contentLength,
      ...requestHeaders
    } = req.headers;
    /* eslint-enable */

    try {
      const { data, headers, status, statusText } = await lastValueFrom(
        this.http.post(this.mattermostWebhook, body, {
          headers: requestHeaders,
          responseType: 'stream',
          validateStatus: () => true,
        }),
      );

      res.statusCode = status;
      res.statusMessage = statusText;
      res.set(headers);

      await pipeline(data as Readable, res);
    } catch (err) {
      console.error('ERROR', err);
      throw err;
    }
  }
}

@Module({ controllers: [ForwardsController] })
export class ForwardsModule {}
