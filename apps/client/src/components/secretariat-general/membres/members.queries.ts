import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

export type MemberListItem = { id: string; firstName: string; lastName: string; role: Role };

export function useMemberListQuery(options: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['listMembers', options.page, options.limit],
    queryFn: () => {
      const searchParams = new URLSearchParams(
        Object.entries(options).map(([k, v]) => [k, String(v)])
      ).toString();

      return apiFetch<{ items: MemberListItem[]; totalCount: number }>(
        `/members/v1${searchParams ? `?${searchParams}` : ''}`,
        { method: 'GET' }
      );
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
      await queryClient.invalidateQueries({ queryKey: ['detailsMember', options.userId] });
    }
  });
}
