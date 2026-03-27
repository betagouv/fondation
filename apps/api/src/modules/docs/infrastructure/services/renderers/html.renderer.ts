import { Injectable, Logger } from '@nestjs/common';

import { Template } from './templates/templates.types';

@Injectable()
export class HtmlRenderer {
  private readonly logger = new Logger(HtmlRenderer.name);

  render<Context extends Record<string, unknown>>(
    template: Template<Context>,
    context: Context,
  ): Promise<string> {
    const rendered = template.render(context);
    this.logger.debug(rendered);

    return Promise.resolve(rendered);
  }
}
