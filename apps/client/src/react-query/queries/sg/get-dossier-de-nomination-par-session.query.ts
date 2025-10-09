import { useQuery } from '@tanstack/react-query';
import type { DossierDeNominationRestContrat } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

type Endpoint = DossierDeNominationRestContrat['endpoints']['dossierDeNominationEtAffectationParSession'];
type GetDossiersDeNominationParSessionArgs = Endpoint['params'];
type GetDossiersDeNominationParSessionResponse = Endpoint['response'];

const fetchDossiersDeNominationParSession = ({ sessionId }: GetDossiersDeNominationParSessionArgs) => {
  const queries = new URLSearchParams({
    sessionId
  });
  return apiFetch<GetDossiersDeNominationParSessionResponse>(
    `/nominations/dossier-de-nominations/snapshot/by-session?${queries}`,
    { method: 'GET' }
  );
};

export const useGetDossierDeNominationParSession = ({ sessionId }: GetDossiersDeNominationParSessionArgs) => {
  return useQuery({
    queryKey: ['dossiers-de-nomination-par-session', sessionId],
    queryFn: () => fetchDossiersDeNominationParSession({ sessionId }),
    enabled: !!sessionId,
    retry: false
  });
};
