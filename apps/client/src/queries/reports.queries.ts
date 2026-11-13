import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ReportStatusEnum } from '@/shared/enums/report-status.enum';
import { withScreenshotUrls } from '@/utils/with-screenshot-urls';
import * as $api from '@api/sdk';
import type { AttachFilesData } from '@api/types';

import { memberKeys } from './members.queries';

export const reportKeys = {
  reportById: (props: { reportId: string }) => ['report', props.reportId],
  myReport: (props: { nominationFileId: string }) => ['report', 'mine', props.nominationFileId],
};

export const useMyReportQuery = (props: {
  enabled: boolean;
  nominationFileId: string;
  sessionId: string;
  userId: string | undefined;
}) =>
  useQuery({
    enabled: props.enabled && !!props.userId,
    queryFn: async () => {
      const { data } = await $api.members.searchNominationFileMembersReport({
        path: {
          nominationFileId: props.nominationFileId,
          sessionId: props.sessionId,
          userId: props.userId ?? '',
        },
      });
      return data?.report ?? null;
    },
    queryKey: reportKeys.myReport({ nominationFileId: props.nominationFileId }),
  });

export const useGenerateReportAttachmentUrlMutation = () =>
  useMutation({
    mutationFn: async (path: { fileId: string; reportId: string }): Promise<string> => {
      const { data } = await $api.reports.getAttachmentUrl({ path });
      if (!data) throw new Error(`no public url for ${path.fileId}`);

      return data.url;
    },
  });

export const useReportQuery = (reportId: string) =>
  useQuery({
    queryKey: reportKeys.reportById({ reportId }),
    queryFn: async () => {
      const { data: report } = await $api.reports.detailReport({
        path: { reportId },
      });

      if (!report) return null;

      return {
        ...report,
        comment: report.comment ? withScreenshotUrls(report.comment, report.screenshots) : null,
      };
    },
  });

export function useUpdateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: 3,

    mutationFn: async (props: {
      reportId: string;
      data: { comment?: string; status?: ReportStatusEnum };
    }): Promise<void> => {
      const { reportId, data: body } = props;
      await $api.reports.updateReport({ path: { reportId }, body });
    },

    onSettled: (_data, _error, { reportId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
        queryClient.invalidateQueries({ queryKey: memberKeys.allListMemberSessionReports() }),
      ]),
  });
}

export function useDetachReportAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: { fileId: string; reportId: string }) => $api.reports.detachAttachment({ path }),
    onSettled: (_data, _error, { reportId }) =>
      queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
  });
}

export function useAttachReportFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: {
      files: File[];
      reportId: string;
      usage: AttachFilesData['query']['usage'];
    }) => {
      const { files, reportId, usage } = mutation;
      await $api.reports.attachFiles({
        path: { reportId },
        body: { files: files as File[] },
        query: { usage },
      });
    },
    onSettled: (_data, _error, { reportId }) =>
      queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
  });
}

export function useAttachScreenshotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mutation: { reportId: string; files: readonly File[] }) => {
      const { data } = await $api.reports.attachScreenshots({
        path: { reportId: mutation.reportId },
        body: { files: mutation.files as File[] },
      });

      return data ?? null;
    },
    onSettled: (_data, _error, { reportId }) =>
      queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
  });
}
