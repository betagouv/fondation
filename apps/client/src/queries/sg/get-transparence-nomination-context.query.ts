import { useQuery } from '@tanstack/react-query';
import type { NominationsContextTransparenceRestContract } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

type GetTransparenceArgs =
  NominationsContextTransparenceRestContract['endpoints']['transparenceSnapshot']['queryParams'];

const getTransparence = (args: GetTransparenceArgs) => {
  const { day, formation, month, nom, year } = args;

  const queries = new URLSearchParams({
    day: day.toString(),
    month: month.toString(),
    nom,
    year: year.toString(),
    formation
  });
  return apiFetch(
    `/nominations/transparence/snapshot/by-nom-formation-et-date?${new URLSearchParams(queries)}`,
    {
      method: 'GET'
    }
  );
};

export const useGetTransparenceNominationContext = (args: GetTransparenceArgs) => {
  return useQuery({
    queryKey: ['transparence', args],
    queryFn: () => getTransparence(args)
  });
};
