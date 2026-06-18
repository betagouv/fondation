import Button from '@codegouvfr/react-dsfr/Button';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { DeleteAttachmentModal } from '@/components/shared/DeleteAttachmentModal';
import { generateReportFilePublicUrl } from '@queries/reports.queries';

export function AttachedFilesList(props: {
  reportId: string;
  attachments: { name: string; fileId: string }[];
  onDelete: (fileName: string) => unknown;
}) {
  const { mutate: createAttachmentLink } = useMutation({
    mutationFn: async (fileName: string) => {
      const result = await generateReportFilePublicUrl({
        reportId: props.reportId,
        fileNames: [fileName],
      });
      if (!result || !result.items.length) throw new Error();

      const $a = document.createElement('a');
      $a.href = result.items[0].url;
      $a.target = '_blank';
      $a.rel = 'noopener noreferrer';

      document.body.appendChild($a);

      $a.click();
      $a.remove();
    },
  });

  return (
    <ul className={clsx('flex flex-col gap-2')}>
      {props.attachments.map((file) => (
        <li key={file.fileId} className="flex items-center gap-4">
          <Button
            priority="tertiary no outline"
            className="text-ellipsis"
            onClick={() => createAttachmentLink(file.name)}
          >
            {file.name}
          </Button>

          <DeleteAttachmentModal fileName={file.name} onDelete={() => props.onDelete(file.name)} />
        </li>
      ))}
    </ul>
  );
}
