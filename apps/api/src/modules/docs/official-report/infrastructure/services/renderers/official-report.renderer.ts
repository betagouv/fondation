import { Injectable } from '@nestjs/common';

import type { DocBlock } from '../../../domain/official-report-doc-block';

import {
  officialReportBlocks,
  officialReportTemplate,
  type OfficialReportRenderContext,
} from './official-report.html';

export type { OfficialReportRenderContext };

@Injectable()
export class OfficialReportRenderer {
  html(ctx: OfficialReportRenderContext): string {
    return officialReportTemplate.render(ctx);
  }

  blocks(ctx: OfficialReportRenderContext): DocBlock[] {
    return Array.from(officialReportBlocks(ctx));
  }
}
