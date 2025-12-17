import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

export type MemberListItem = { id: string; firstName: string; lastName: string; role: Role };

export type MemberSortField = 'lastName' | 'firstName' | 'role';

export type MemberListQueryOptions = {
  page?: number;
  limit?: number;
  sortField?: MemberSortField | null;
  sortDirection?: 'asc' | 'desc';
};

export function useMemberListQuery(options: MemberListQueryOptions = {}) {
  const { page, limit, sortField, sortDirection } = options;

  return useQuery({
    queryKey: ['listMembers', { page, limit, sortField, sortDirection }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (page) params.set('page', String(page));
      if (limit) params.set('limit', String(limit));
      if (sortField) params.set('sortField', sortField);
      if (sortDirection) params.set('sortDirection', sortDirection);

      const queryString = params.toString();
      return apiFetch<{
        items: MemberListItem[];
        totalCount: number;
        currentPageIndex: number;
        nextPageIndex?: number;
        previousPageIndex?: number;
      }>(`/members/v1${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    }
  });
}

export type DetailedMember = {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;

  excludedJurisdictions: { id: string; label: string | null }[];
};

export function useDetailedMember(options: { userId: string | undefined }) {
  return useQuery({
    enabled: !!options.userId,
    queryKey: ['detailsMember', options.userId],
    queryFn: () => {
      return apiFetch<DetailedMember>(`/members/v1/${options.userId}`, { method: 'GET' });
    }
  });
}

export function useExcludedJurisdictionsMutation(options: { userId: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jurisdictionIds: readonly string[]) => {
      await apiFetch<void>(`/members/v1/${options.userId}/excluded-jurisdictions`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jurisdictionIds })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detailsMember', options.userId] })
  });
}
