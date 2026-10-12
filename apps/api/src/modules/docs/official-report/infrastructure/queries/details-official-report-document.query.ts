import { Injectable } from '@nestjs/common';

import { OfficialReportRenderContextFinder } from '../finders/official-report-render-context.finder';
import { DetailedOfficialReportDocumentDto } from '../official-reports.dto';
import { OfficialReportRenderer } from '../services/renderers/official-report.renderer';

@Injectable()
export class DetailsOfficialReportDocumentQuery {
  constructor(
    private readonly officialReportRenderContextFinder: OfficialReportRenderContextFinder,
    private readonly officialReportRenderer: OfficialReportRenderer,
  ) {}

  async handle(query: { id: string }): Promise<DetailedOfficialReportDocumentDto> {
    return {
      blocks: this.officialReportRenderer.blocks(
        await this.officialReportRenderContextFinder.find({ officialReportId: query.id }),
      ),
    };
  }
}
