import { useQuery } from '@tanstack/react-query';
import { ReportFileUsage, type ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';
import type { ReportScreenshots, ReportSM } from './list-reports.queries';

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

  if (!data) {
    return { report: null, isPending, error, refetch };
  }

  const initialContentScreenshots: ReportScreenshots = {
    files: []
  };
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
        initialContentScreenshots
      ) ?? null;

  const attachedFiles =
    data?.attachedFiles
      ?.filter((file) => file.usage === ReportFileUsage.ATTACHMENT)
      .map((file) => ({
        fileId: file.fileId,
        name: file.name,
        signedUrl: null
      })) ?? null;

  const report: ReportSM = {
    ...data,
    contentScreenshots,
    attachedFiles
  };

  return { report, isPending, error, refetch };
};
