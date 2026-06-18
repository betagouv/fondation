import { reportHtmlIds } from '@/features/reports/dom/html-ids';
import type { DetailedReportDto } from '@api/types';

import { Card } from './Card';

export function ReportOverviewFileComment(props: { report: DetailedReportDto }) {
  const comment = props.report.fileComment;
  if (!comment) return null;

  return (
    <Card id={reportHtmlIds.overview.fileComment}>
      <h2 id={reportHtmlIds.overview.biography}>Historique proposition</h2>
      <div
        aria-labelledby={reportHtmlIds.overview.biography}
        className="rounde w-full leading-10 whitespace-pre-line"
      >
        {comment}
      </div>
    </Card>
  );
}
