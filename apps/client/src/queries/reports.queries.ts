import { useMutation, useQuery } from '@tanstack/react-query';

import * as $api from '@api/sdk';
import type { AttachFilesData } from '@api/types';

import { ACCEPTED_MIME_TYPES } from '@/constants/mimetypes.constants';
import type { ReportStatusEnum } from '@/types/enums.types';
import { InvalidMimeTypeError } from '@/utils/InvalidMimeType.error';

export const reportKeys = {
  reportById: (props: { reportId: string }) => ['report', props.reportId]
};

export function generateReportFilePublicUrl(props: { reportId: string; fileNames: readonly string[] }) {
  return $api.reports
    .getReportFilesUrl({
      path: { reportId: props.reportId },
      query: { fileNames: props.fileNames as string[] }
    })
    .then(({ data }) => data ?? null);
}

function updateCommentScreenshots(
  html: string,
  screenshots: readonly { fileId: string; name: string; url: string }[]
): string {
  const byId = new Map(screenshots.map((s) => [s.fileId, s]));
  const byName = new Map(screenshots.map((s) => [s.name, s]));

  const $div = document.createElement('div');
  $div.innerHTML = html;

  for (const $img of $div.querySelectorAll('img')) {
    let file: { fileId: string; name: string; url: string } | undefined;

    if ($img.dataset.fileId) {
      file = byId.get($img.dataset.fileId);
    }

    if (!file && $img.dataset.fileName) {
      file = byName.get($img.dataset.fileName);
    }

    if (file) {
      $img.dataset.fileId = file.fileId;
      $img.dataset.fileName = file.name;
      $img.src = file.url;
      continue;
    }
  }

  return $div.innerHTML;
}

export const useReportById = (reportId: string) =>
  useQuery({
    queryKey: reportKeys.reportById({ reportId }),
    queryFn: async () => {
      const { data: report } = await $api.reports.detailReport({
        path: { reportId }
      });

      if (!report) return null;

      const updatedComment =
        report.comment && report.screenshots.length
          ? updateCommentScreenshots(report.comment, report.screenshots)
          : report.comment || null;

      return { ...report, comment: updatedComment };
    }
  });

export const useUpdateReport = () =>
  useMutation({
    mutationFn: async (props: {
      reportId: string;
      data: { comment?: string; status?: ReportStatusEnum };
    }): Promise<void> => {
      const { reportId, data: body } = props;
      await $api.reports.updateReport({ path: { reportId }, body });
    }
  });

export const useUpdateReportRuleValidation = () =>
  useMutation({
    mutationFn: async (props: { reportId: string; ruleId: string; isValidated: boolean }): Promise<void> => {
      const { reportId, ruleId, isValidated } = props;
      await $api.reports.updateReportRuleValidation({
        path: { reportId, ruleId },
        body: { isValidated }
      });
    }
  });

export const useDetachReportFiles = () =>
  useMutation({
    mutationFn: (props: { reportId: string; fileNames: readonly string[] }) =>
      $api.reports.detachFiles({
        path: { reportId: props.reportId },
        query: { fileNames: props.fileNames as string[] }
      })
  });

export const useAttachReportFiles = () =>
  useMutation({
    mutationFn: async (mutation: {
      files: File[];
      reportId: string;
      usage: AttachFilesData['query']['usage'];
    }) => {
      const { files, reportId, usage } = mutation;
      for (const file of files) {
        if (!ACCEPTED_MIME_TYPES.includes(file.type)) throw new InvalidMimeTypeError({ fileName: file.name });
      }

      await $api.reports.attachFiles({
        path: { reportId },
        body: { files: files as File[] },
        query: { usage }
      });
    }
  });

async function getReportImageUrls(props: {
  reportId: string;
  files: readonly File[];
}): Promise<{ file: File; name: string; signedUrl: string; fileId: string }[]> {
  const result = await generateReportFilePublicUrl({
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

export const useInsertImagesWithSignedUrls = () =>
  useMutation({
    mutationFn: async ({ reportId, files }: { reportId: string; files: readonly File[] }) => {
      await $api.reports.attachFiles({
        path: { reportId },
        body: { files: files as File[] },
        query: { usage: 'EMBEDDED_SCREENSHOT' }
      });

      return getReportImageUrls({ reportId, files });
    }
  });

export const useAttachScreenshotMutation = () =>
  useMutation({
    mutationFn: async (mutation: { reportId: string; files: readonly File[] }) => {
      const { data } = await $api.reports.attachScreenshots({
        path: { reportId: mutation.reportId },
        body: { files: mutation.files as File[] }
      });

      return data ?? null;
    }
  });
