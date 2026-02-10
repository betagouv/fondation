import type { DetailedReportDto } from '@api/types';
import { ReportVM } from '../../../../VM/ReportVM';
import { reportHtmlIds } from '../../dom/html-ids';
import { Card } from './Card';

export function ReportOverviewFileComment(props: { report: DetailedReportDto }) {
  const comment = props.report.fileComment;
  if (!comment) return null;

  return (
    <Card id={reportHtmlIds.overview.fileComment}>
      <h2 id={reportHtmlIds.overview.biography}>{ReportVM.fileCommentLabel}</h2>
      <div
        aria-labelledby={reportHtmlIds.overview.biography}
        className="rounde w-full whitespace-pre-line leading-10"
      >
        {comment}
      </div>
    </Card>
  );
}
