import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../utils/api-fetch.utils';

const deleteFile = (id: string) => {
  return apiFetch(`/files/byId/${id}`, { method: 'DELETE' });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: (id: string) => deleteFile(id)
  });
};
