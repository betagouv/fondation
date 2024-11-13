import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { TextareaCard } from "./TextareaCard";

export type CommentProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
};

export const Comment: React.FC<CommentProps> = ({ comment, onUpdate }) => (
  <TextareaCard
    id="comment"
    label={ReportVM.commentLabel}
    content={comment}
    onContentChange={onUpdate}
    placeholder={ReportVM.commentPlaceholder}
    rowsCount={10}
  />
);
