import { useQuery } from '@tanstack/react-query';
import {
  ReportFileUsage,
  type ReportRetrievalVM,
  type ReportsContextRestContract
} from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';
import type { ReportScreenshots, ReportSM } from './list-reports.queries';

const getReportById = async (id: string): Promise<ReportRetrievalVM> => {
  const {
    method
  }: Partial<ReportsContextRestContract['endpoints']['retrieveReport']> = {
    method: 'GET'
  };

  return await apiFetch(`/reports/${id}`, {
    method
  });
};

export const useReportById = (
  id: string
): { report: ReportSM | null; isPending: boolean; error: Error | null } => {
  const { data, isPending, error } = useQuery({
    queryKey: ['report', id],
    queryFn: () => getReportById(id)
  });

  if (!data) {
    return { report: null, isPending, error };
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

  return { report, isPending: isLoading, error };
};
