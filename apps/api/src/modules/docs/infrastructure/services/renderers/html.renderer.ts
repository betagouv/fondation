import { Injectable } from '@nestjs/common';
import { render } from 'pug';

import { AbstractTemplateContext, Template } from './templates/templates.types';

@Injectable()
export class HtmlRenderer<Context extends AbstractTemplateContext> {
  render(template: Template<Context>, context: Context): Promise<string> {
    return Promise.resolve(render(template.toString(), context));
  }
}
