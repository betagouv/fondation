import { ReportVM } from "../../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../../dom/html-ids";
import { TextareaCard } from "../TextareaCard";

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({
  comment,
  onUpdate,
}) => (
  <TextareaCard
    cardId={reportHtmlIds.overview.commentSection}
    titleId={reportHtmlIds.overview.comment}
    label={ReportVM.commentLabel}
    content={comment}
    onContentChange={onUpdate}
  />
);
