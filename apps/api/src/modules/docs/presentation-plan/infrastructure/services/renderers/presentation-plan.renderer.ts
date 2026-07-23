import { Injectable } from '@nestjs/common';

import { presentationPlanTemplate } from './presentation-plan.html';

export type PresentationPlanRenderContext = typeof presentationPlanTemplate.$type;

@Injectable()
export class PresentationPlanRenderer {
  html(context: PresentationPlanRenderContext): string {
    return presentationPlanTemplate.render(context);
  }
}
