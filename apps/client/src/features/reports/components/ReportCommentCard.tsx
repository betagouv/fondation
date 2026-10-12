import { useIntl } from 'react-intl';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { DetailsCard } from '@/shared/ui/details';
import { TipTapEditor, type FilesUploader } from '@/shared/ui/tip-tap-editor';

export function ReportCommentCard(props: {
  comment: string | null;
  isReadOnly?: boolean;
  onUpdate: (comment: string) => void;
  uploadFiles?: FilesUploader;
}) {
  const { formatMessage } = useIntl();

  return (
    <DetailsCard>
      <h2 className="fr-h6" id={reportHtmlIds.overview.comment}>
        {formatMessage({ defaultMessage: 'Rapport' })}
      </h2>

      <div className="-mt-8 [&_.ProseMirror]:min-h-60">
        <TipTapEditor
          ariaLabelledby={reportHtmlIds.overview.comment}
          onChange={props.onUpdate}
          readOnly={props.isReadOnly}
          uploadFiles={props.uploadFiles}
          value={props.comment ?? undefined}
        />
      </div>
    </DetailsCard>
  );
}
