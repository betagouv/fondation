import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { lastValueFrom } from 'rxjs';

import { API_CONFIG_TOKEN, ApiConfig } from './config';

const RECIPIENTS = '- @jessica.kossibale\n- @remi.boureau.lienard';
const ALERT_COLOR = '#dc2626';

@Injectable()
export class Mattermost {
  private readonly logger = new Logger(Mattermost.name);

  constructor(
    private readonly http: HttpService,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {}

  async alert(props: { title: string; text: string }): Promise<void> {
    const webhook = this.config.mattermostWebhook;
    if (!webhook) {
      this.logger.warn(`Aucun webhook Mattermost configuré, alerte non envoyée`);
      return;
    }

    const attachment = {
      ...props,
      color: ALERT_COLOR,
      fields: [{ short: true, title: 'CC', value: RECIPIENTS }],
    };

    await lastValueFrom(this.http.post(webhook, { attachments: [attachment] })).catch((error) => {
      this.logger.error(`Failed alerting mattermost`, error);
      Sentry.captureException(error);
    });
  }
}

@Module({ providers: [Mattermost], exports: [Mattermost] })
export class MattermostModule {}
