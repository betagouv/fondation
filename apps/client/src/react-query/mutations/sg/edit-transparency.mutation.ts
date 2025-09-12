import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DataAdministrationContextRestContract, EditTransparencyDto } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';
import { SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY } from '../../queries/get-transparency-attachments.query';

type Endpoint = DataAdministrationContextRestContract['endpoints']['updateTransparence'];
type UpdateTransparenceArgs = Endpoint['body'];
type UpdateTransparenceResponse = Endpoint['response'];

const editTransparency = async (id: string, transparency: UpdateTransparenceArgs) => {
  return apiFetch<UpdateTransparenceResponse>(`/data-administration/transparence-snapshot/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transparency)
  });
};

export const useEditTransparency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transparency }: { id: string; transparency: EditTransparencyDto }) =>
      editTransparency(id, transparency),
    onSuccess: async (_, { id }) => {
      await queryClient.refetchQueries({
        queryKey: [SG_TRANSPARENCY_ATTACHMENTS_QUERY_KEY, id]
      });
    }
  });
};
