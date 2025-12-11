import { useMutation } from '@tanstack/react-query';
import { ReportFileUsage } from 'shared-models';
import { attachReportFiles } from '../attach-report-files.mutation';
import { getReportFileUrlsMutation } from '../../../queries/reports.queries';

export const addTimestampToFiles = async (files: File[], timestamp: number) => {
  return await Promise.all(
    files.map(async (file) => {
      const screenshotName = `${file.name}-${timestamp}`;

      return new File([await file.arrayBuffer()], screenshotName, {
        type: file.type
      });
    })
  );
};

async function getReportImageUrls(props: {
  reportId: string;
  files: readonly File[];
}): Promise<{ file: File; name: string; signedUrl: string; fileId: string }[]> {
  const result = await getReportFileUrlsMutation({
    reportId: props.reportId,
    fileNames: props.files.map(({ name }) => name)
  });

  if (!result) return [];

  const fileByName = new Map(props.files.map((file) => [file.name, file]));
  return result.items
    .map(({ id: fileId, name, url: signedUrl }) => {
      const file = fileByName.get(name);
      if (!file) return undefined;

      return { file, name, signedUrl, fileId };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

const insertImagesWithSignedUrls = async (
  reportId: string,
  files: readonly File[]
): Promise<{ file: File; signedUrl: string }[]> => {
  await attachReportFiles(reportId, files, ReportFileUsage.EMBEDDED_SCREENSHOT);
  return getReportImageUrls({ reportId, files });
};

export const useInsertImagesWithSignedUrls = () => {
  return useMutation({
    mutationFn: ({ reportId, files }: { reportId: string; files: readonly File[] }) =>
      insertImagesWithSignedUrls(reportId, files)
  });
};
