import { useQuery } from '@tanstack/react-query';
import type { Magistrat, NominationFile, ReportsContextRestContract } from 'shared-models';
import type { DateOnlyStoreModel } from '../../models/date-only.model';
import { apiFetch } from '../../utils/api-fetch.utils';

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

export type ReportListItem = Pick<
  DetailedReportDto,
  | 'id'
  | 'sessionId'
  | 'folderNumber'
  | 'state'
  | 'dueDate'
  | 'formation'
  | 'name'
  | 'transparency'
  | 'grade'
  | 'targettedPosition'
  | 'dateTransparence'
> & { observersCount: number; sessionImportId: string };

interface ListReportsResponse {
  data: ReportListItem[];
}

const listReports = async () => {
  const { method, path }: Partial<ReportsContextRestContract['endpoints']['listReports']> = {
    method: 'GET',
    path: 'transparences'
  };

  return apiFetch<ListReportsResponse>(`/reports/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const useListReports = () => {
  return useQuery({
    queryKey: ['listReports'],
    queryFn: listReports,
    refetchOnWindowFocus: false,
    retry: false
  });
};
