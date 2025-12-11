import { apiFetch } from '../../utils/api-fetch.utils';

export function getReportFileUrlsMutation(props: { reportId: string; fileNames: readonly string[] }) {
  const urlSearchParams = new URLSearchParams();
  for (const fileName of props.fileNames) {
    urlSearchParams.append('fileNames', fileName);
  }

  return apiFetch<{ items: { id: string; name: string; url: string }[] }>(
    `/reports/v2/${props.reportId}/files/url?${urlSearchParams}`,
    { method: 'GET' }
  );
}
