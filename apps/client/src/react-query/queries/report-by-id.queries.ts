import { useQuery } from '@tanstack/react-query';
import { ReportFileUsage, type ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';
import { extractScreenshotFileIds, refreshSignedUrlsInComment } from '../../utils/refresh-signed-urls.utils';
import { useGetSignedUrl } from './get-signed-url.query';
import type { ReportSM } from './list-reports.queries';

type Endpoint = ReportsContextRestContract['endpoints']['retrieveReport'];

type GetReportByIdResponse = Endpoint['response'];

const getReportById = async (id: string) => {
  const { method }: Partial<Endpoint> = {
    method: 'GET'
  };

  return await apiFetch<GetReportByIdResponse>(`/reports/${id}`, {
    method
  });
};

export const useReportById = (
  id: string
): {
  report: ReportSM | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['report', id],
    queryFn: () => getReportById(id)
  });

  // Récupérer les URLs signées pour les screenshots si nécessaire
  const contentScreenshots =
    data?.attachedFiles
      ?.filter((file) => file.usage === ReportFileUsage.EMBEDDED_SCREENSHOT)
      .reduce(
        (acc, file) => ({
          files: [
            ...acc.files,
            {
              fileId: file.fileId,
              name: file.name,
              signedUrl: null
            }
          ]
        }),
        { files: [] as Array<{ fileId: string | null; name: string; signedUrl: string | null }> }
      ) ?? null;

  const screenshotFileIds = contentScreenshots?.files
    ? extractScreenshotFileIds(contentScreenshots.files)
    : [];

  const { data: signedUrlsData } = useGetSignedUrl(screenshotFileIds);

  if (!data) {
    return { report: null, isPending, error, refetch };
  }

  const finalContentScreenshots = contentScreenshots ?? null;

  const attachedFiles =
    data?.attachedFiles
      ?.filter((file) => file.usage === ReportFileUsage.ATTACHMENT)
      .map((file) => ({
        fileId: file.fileId,
        name: file.name,
        signedUrl: null
      })) ?? null;

  // Rafraîchir les URLs signées dans le commentaire si nécessaire
  let updatedComment = data.comment;
  if (data.comment && finalContentScreenshots?.files && signedUrlsData) {
    updatedComment = refreshSignedUrlsInComment(data.comment, finalContentScreenshots.files, signedUrlsData);
  }

  const report: ReportSM = {
    ...data,
    comment: updatedComment,
    contentScreenshots: finalContentScreenshots,
    attachedFiles
  };

  return { report, isPending, error, refetch };
};
