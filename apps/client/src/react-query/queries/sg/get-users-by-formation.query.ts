import { useQuery } from '@tanstack/react-query';
import { Magistrat, type UserRestContract } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

type Endpoint = UserRestContract['endpoints']['usersByFormation'];
type GetUsersByFormationResponse = Endpoint['response'];

const getUsersByFormation = (formation: Magistrat.Formation) => {
  return apiFetch<GetUsersByFormationResponse>(`/users/by-formation/${formation}`, {
    method: 'GET'
  });
};

export const useGetUsersByFormation = (formation: Magistrat.Formation) => {
  return useQuery({
    queryKey: ['users-by-formation', formation],
    queryFn: () => getUsersByFormation(formation)
  });
};
