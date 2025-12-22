import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../utils/api-fetch.utils';
import type { NominationFile, Magistrat } from 'shared-models';
import type { DateOnlyStoreModel } from '../../models/date-only.model';

export const useReportById = (id: string) =>
  useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const report = await apiFetch<DetailedReportDto>(`/reports/v2/${id}`, {
        method: 'GET'
      });

      if (!report) return null;

      const updatedComment =
        report.comment && report.screenshots.length
          ? updateCommentScreenshots(report.comment, report.screenshots)
          : report.comment || null;

      return { ...report, comment: updatedComment } satisfies DetailedReportDto;
    }
  });

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

export interface DetailedReportDto {
  id: string;
  sessionId: string;
  folderNumber: number | null;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  name: string;
  biography: string | null;
  dueDate: DateOnlyStoreModel | null;
  birthDate: DateOnlyStoreModel;
  transparency: string;
  dateTransparence: DateOnlyStoreModel;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules;
  attachments: { name: string; fileId: string }[];
  screenshots: { fileId: string; name: string; url: string }[];
  dureeDuPoste: string | null;
}
