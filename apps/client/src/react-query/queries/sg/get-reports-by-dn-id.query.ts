import { useQuery } from '@tanstack/react-query';
import type { ReportsContextRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

type Endpoint = ReportsContextRestContract['endpoints']['listReportByDnId'];
type GetReportByDnIdResponse = Endpoint['response'];
type GetReportByDnIdParams = Endpoint['params'];

const getReportsByDnId = (dnId: GetReportByDnIdParams['dnId']) => {
  const url = `/reports/by-dn-id`;

  const queries = new URLSearchParams({
    dnId
  });

  return apiFetch<GetReportByDnIdResponse>(`${url}?${queries}`, { method: 'GET' });
};

export const useGetReportsByDnId = (dnId: GetReportByDnIdParams['dnId'], options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['report-by-dn-id', dnId],
    queryFn: () => getReportsByDnId(dnId),
    enabled: options?.enabled ?? true
  });
};
