import { ReportVM } from "../../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../../dom/html-ids";
import { TextareaCard } from "../TextareaCard";

export type ReportEditorProps = {
  reportId: string;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({ reportId }) => (
  <TextareaCard
    cardId={reportHtmlIds.overview.commentSection}
    titleId={reportHtmlIds.overview.comment}
    label={ReportVM.commentLabel}
    reportId={reportId}
  />
);
