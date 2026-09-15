import type React from 'react';
import { FormattedMessage } from 'react-intl';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { DetailsCard } from '@/shared/ui/details';
import { Upload } from '@/shared/ui/upload';
import { DOCUMENT_FILE_TYPES } from '@/shared/ui/upload/file-types';

export function ReportAttachmentsCard(props: {
  children?: React.ReactNode;
  isPending?: boolean;
  isReadOnly?: boolean;
  onFilesAttached: (files: File[]) => void;
}) {
  return (
    <DetailsCard>
      <h2 className="fr-h6" id={reportHtmlIds.overview.attachedFilesSection}>
        <FormattedMessage defaultMessage="Mes pièces jointes" />
      </h2>
      <div className="flex flex-col gap-6">
        <Upload
          accept={DOCUMENT_FILE_TYPES}
          disabled={props.isReadOnly}
          hint={<FormattedMessage defaultMessage="Formats supportés : png, jpeg, pdf, doc et docx." />}
          isPending={props.isPending}
          label={<FormattedMessage defaultMessage="Ajouter un fichier" />}
          multiple
          onChange={props.onFilesAttached}
        />
        {props.children}
      </div>
    </DetailsCard>
  );
}
