import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DossierDeNominationRestContrat, SaveAffectationsRapporteursDto } from 'shared-models';
import { apiFetch } from '../../utils/api-fetch.utils';

type Endpoint = DossierDeNominationRestContrat['endpoints']['saveAffectationsRapporteurs'];
type SaveAffectationsRapporteursArgs = Endpoint['body'];
type SaveAffectationsRapporteursResponse = Endpoint['response'];

const saveAffectationsRapporteurs = async (body: SaveAffectationsRapporteursArgs) => {
  return apiFetch<SaveAffectationsRapporteursResponse>(
    '/nominations/dossier-de-nominations/affectations-rapporteurs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
};

export const useSaveAffectationsRapporteurs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: SaveAffectationsRapporteursDto) => saveAffectationsRapporteurs(args),
    onSuccess: async (_, { sessionId }) => {
      // Invalider les queries des dossiers de nomination pour cette session
      await queryClient.invalidateQueries({
        queryKey: ['dossiers-nomination', sessionId]
      });
    }
  });
};
