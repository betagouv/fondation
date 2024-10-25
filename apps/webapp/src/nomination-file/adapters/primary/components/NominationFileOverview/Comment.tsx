import { NominationFileVM } from "../../selectors/selectNominationFile";
import { TextareaCard } from "./TextareaCard";

export type CommentProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
};

export const Comment: React.FC<CommentProps> = ({ comment, onUpdate }) => (
  <TextareaCard
    id="comment"
    label={NominationFileVM.commentLabel}
    content={comment}
    onContentChange={onUpdate}
    placeholder={NominationFileVM.commentPlaceholder}
    rowsCount={10}
  />
);
