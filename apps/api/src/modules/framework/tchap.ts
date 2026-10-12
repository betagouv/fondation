import { randomUUID } from 'node:crypto';

import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Inject,
  Injectable,
  Logger,
  Module,
  Post,
  ServiceUnavailableException,
  UsePipes,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import z from 'zod';

import { HasRole } from '../simple-auth';
import { describeErrorWithoutSecrets } from 'src/utils/describe-error-without-secrets';
import { escapeHtml } from 'src/utils/escape-html';

import { API_CONFIG_TOKEN, ApiConfig } from './config';

export class SendAlertDto extends createZodDto(
  z.object({ text: z.string().trim().nonempty(), title: z.string().trim().nonempty() }),
) {}

@Injectable()
export class Tchap {
  private readonly logger = new Logger(Tchap.name);

  constructor(
    private readonly http: HttpService,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {}

  async alert(props: { text: string; title: string }): Promise<boolean> {
    const tchap = this.config.tchap;
    if (!tchap) {
      this.logger.warn(`Aucun salon Tchap configuré, alerte non envoyée`);
      return false;
    }

    // Matrix drops a resend carrying the same transaction id, so a retry never posts twice
    const url = `${tchap.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(tchap.roomId)}/send/m.room.message/${randomUUID()}`;
    const message = {
      body: `${props.title}\n\n${props.text}`,
      format: 'org.matrix.custom.html',
      formatted_body: `<strong>${escapeHtml(props.title)}</strong><br><br>${escapeHtml(props.text).replaceAll('\n', '<br>')}`,
      msgtype: 'm.text',
    };
    const headers = { authorization: `Bearer ${tchap.accessToken}` };

    return lastValueFrom(this.http.put(url, message, { headers }))
      .then(() => true)
      .catch((error) => {
        this.logger.error(`Failed alerting Tchap: ${describeErrorWithoutSecrets(error)}`);
        Sentry.captureException(error);

        return false;
      });
  }
}

// The SDV relay holds no Tchap credentials: it hands its alerts to the API
@Controller('/api/tchap')
@ApiExcludeController()
@UsePipes(ZodValidationPipe)
export class TchapController {
  constructor(private readonly tchap: Tchap) {}

  @Post('/alerts')
  @HasRole('MACHINE')
  async sendAlert(@Body() body: SendAlertDto): Promise<void> {
    if (!(await this.tchap.alert(body))) throw new ServiceUnavailableException();
  }
}

@Module({ controllers: [TchapController], exports: [Tchap], providers: [Tchap] })
export class TchapModule {}
