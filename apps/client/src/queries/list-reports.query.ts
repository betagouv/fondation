import { useQuery } from '@tanstack/react-query';
import type { ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../utils/api-fetch.utils';

interface ReportListItem {
  id: string;
  folderNumber: string;
  name: string;
  dueDate: string;
  state: string;
  formation: string;
  transparency: string;
  grade: string;
  targettedPosition: string;
  observersCount: number;
  dateTransparence: string;
}

interface ListReportsResponse {
  data: ReportListItem[];
}

const listReports = async (): Promise<ListReportsResponse> => {
  const {
    method,
    path
  }: Partial<ReportsContextRestContract['endpoints']['listReports']> = {
    method: 'GET',
    path: 'transparences'
  };

  return apiFetch(`/reports/${path}`, {
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
