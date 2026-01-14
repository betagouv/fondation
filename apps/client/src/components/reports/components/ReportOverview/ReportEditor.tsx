import { reportHtmlIds } from '../../dom/html-ids';

import { ReportVM } from '../../../../VM/ReportVM';
import { TextareaCard } from './TextareaCard';

export type ReportEditorProps = {
  comment: string | null;
  onUpdate: (comment: string) => void;
  reportId: string;
};

export const ReportEditor: React.FC<ReportEditorProps> = ({ comment, onUpdate }) => {
  return (
    <TextareaCard
      cardId={reportHtmlIds.overview.commentSection}
      titleId={reportHtmlIds.overview.comment}
      label={ReportVM.commentLabel}
      content={comment}
      onContentChange={onUpdate}
      uploadFiles={
        // TODO: adds report specific FilesUploader
        (files) =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve(
                  files.map(({ id }) => ({
                    id,
                    fileId: crypto.randomUUID(),
                    name: `name-${crypto.randomUUID()}.png`,
                    url: new URL('https://placehold.co/100x100')
                  }))
                ),
              3_000
            );
          })
      }
    />
  );
};
