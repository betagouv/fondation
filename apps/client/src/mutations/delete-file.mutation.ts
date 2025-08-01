import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../utils/api-fetch.utils';

const deleteFile = (id: string) => {
  const query = new URLSearchParams({ id });
  return apiFetch(`/files?${query}`, { method: 'DELETE' });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: (id: string) => deleteFile(id)
  });
};
