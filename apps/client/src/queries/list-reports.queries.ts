import { useQuery } from '@tanstack/react-query';
import type { Magistrat, NominationFile, ReportsContextRestContract, Transparency } from 'shared-models';
import type { DateOnlyStoreModel } from '../models/date-only.model';
import { apiFetch } from '../utils/api-fetch.utils';

export type ReportScreenshotSM = {
  // On n'a pas de fileId avant la fin de l'upload
  fileId: string | null;
  name: string;
  signedUrl: string | null;
};

export type ReportScreenshots = {
  files: ReportScreenshotSM[];
};

export interface ReportSM {
  id: string;
  folderNumber: number | null;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  name: string;
  biography: string | null;
  dueDate: DateOnlyStoreModel | null;
  birthDate: DateOnlyStoreModel;
  transparency: Transparency;
  dateTransparence: DateOnlyStoreModel;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules;
  attachedFiles:
    | {
        name: string;
        fileId: string | null;
        signedUrl: string | null;
      }[]
    | null;
  contentScreenshots: ReportScreenshots | null;
  dureeDuPoste: string | null;
}
export type ReportListItem = Pick<
  ReportSM,
  | 'id'
  | 'folderNumber'
  | 'state'
  | 'dueDate'
  | 'formation'
  | 'name'
  | 'transparency'
  | 'grade'
  | 'targettedPosition'
  | 'dateTransparence'
> & { observersCount: number };

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
