import { useQuery } from '@tanstack/react-query';
import type { DataAdministrationContextRestContract, TransparenceSnapshot } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

type Endpoint = DataAdministrationContextRestContract['endpoints']['getTransparenceSnapshot'];
type GetTransparenceArgs = Endpoint['queryParams'];
type GetTransparenceResponse = Endpoint['response'];

const getTransparence = (args: GetTransparenceArgs): Promise<TransparenceSnapshot | null> => {
  const { sessionId } = args;

  const queries = new URLSearchParams({
    sessionId
  });
  return apiFetch<GetTransparenceResponse>(
    `/data-administration/transparence-snapshot?${new URLSearchParams(queries)}`,
    {
      method: 'GET'
    }
  );
};

export const USE_GET_TRANSPARENCE_QUERY_KEY = 'transparence';
export const useGetTransparence = (args: GetTransparenceArgs) => {
  return useQuery({
    queryKey: [USE_GET_TRANSPARENCE_QUERY_KEY, args.sessionId],
    queryFn: () => getTransparence(args)
  });
};
