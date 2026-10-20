import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ReportStatusEnum } from '@/shared/enums/report-status.enum';
import { withScreenshotUrls } from '@/shared/ui/tip-tap-editor';
import { SANITIZED_MIME_TYPES } from '@/shared/ui/upload/file-types';
import { InvalidMimeTypeError } from '@/utils/InvalidMimeType.error';
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
      return data?.reportId ?? null;
    },
    queryKey: reportKeys.myReport({ nominationFileId: props.nominationFileId }),
  });

export const useGenerateReportFilePublicUrlMutation = () =>
  useMutation({
    mutationFn: async (mutation: { fileName: string; reportId: string }): Promise<string> => {
      const { data } = await $api.reports.getReportFilesUrl({
        path: { reportId: mutation.reportId },
        query: { fileNames: [mutation.fileName] },
      });

      const [file] = data?.items ?? [];
      if (!file) throw new Error(`no public url for ${mutation.fileName}`);

      return file.url;
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

      const screenshots = report.screenshots.map((s) => ({ id: s.fileId, name: s.name, url: s.url }));
      return { ...report, comment: report.comment ? withScreenshotUrls(report.comment, screenshots) : null };
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

    onSuccess: (_, { reportId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
        queryClient.invalidateQueries({ queryKey: memberKeys.allListMemberSessionReports() }),
      ]),
  });
}

export function useDetachReportFilesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: { reportId: string; fileNames: readonly string[] }) =>
      $api.reports.detachFiles({
        path: { reportId: props.reportId },
        query: { fileNames: props.fileNames as string[] },
      }),
    onSuccess: (_, { reportId }) =>
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
      for (const file of files) {
        if (!SANITIZED_MIME_TYPES.includes(file.type))
          throw new InvalidMimeTypeError({ fileName: file.name });
      }

      await $api.reports.attachFiles({
        path: { reportId },
        body: { files: files as File[] },
        query: { usage },
      });
    },
    onSuccess: (_, { reportId }) =>
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
    onSuccess: (_, { reportId }) =>
      queryClient.invalidateQueries({ queryKey: reportKeys.reportById({ reportId }) }),
  });
}
