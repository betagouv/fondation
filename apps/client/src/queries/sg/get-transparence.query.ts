import { useQuery } from '@tanstack/react-query';
import type { DataAdministrationContextRestContract, TransparenceSnapshot } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

type GetTransparenceArgs =
  DataAdministrationContextRestContract['endpoints']['getTransparenceSnapshot']['queryParams'];

const getTransparence = (args: GetTransparenceArgs): Promise<TransparenceSnapshot | null> => {
  const { day, formation, month, nom, year } = args;

  const queries = new URLSearchParams({
    day: day.toString(),
    month: month.toString(),
    nom,
    year: year.toString(),
    formation
  });
  return apiFetch<TransparenceSnapshot>(
    `/data-administration/transparence-snapshot?${new URLSearchParams(queries)}`,
    {
      method: 'GET'
    }
  );
};

export const useGetTransparence = (args: GetTransparenceArgs) => {
  return useQuery({
    queryKey: ['transparence', args],
    queryFn: () => getTransparence(args)
  });
};
