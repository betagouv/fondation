import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTab } from '@/hooks/useTab';
import type { FormationEnum } from '@/types/enums.types';
import type { PlainDateOnly } from '@/utils/date-only.util';
import * as $api from '@api/sdk';
import type { FoundJusticeContactsDto } from '@api/types';

export const agendaKeys = {
  searchChairmen: (formation: FormationEnum | undefined) => ['agenda', 'searchChairmen', formation] as const,
  findAgendaNominationFiles: (query: { sessionId: string; ignoreAgendaId?: string }) =>
    ['agenda', 'findAgendaNominationFiles', query.sessionId, query.ignoreAgendaId] as const,
  agendaHtml: (id: string) => ['agenda', 'agendaHtml', id] as const,
  findSessionDocs: (sessionId: string) => ['agenda', 'findSessionDocs', sessionId] as const,
  isSessionReadyForDocGeneration: (sessionId: string) =>
    ['agenda', 'isSessionReadyForDocGeneration', sessionId] as const,
  detailsAgendaMetadata: (query: { agendaId: string | undefined | null }) =>
    ['agenda', 'detailsAgendaMetadata', query.agendaId ?? undefined] as const,
};

export const useSearchChairmenQuery = (props: { formation: FormationEnum | undefined }) =>
  useQuery({
    staleTime: Infinity,

    queryKey: agendaKeys.searchChairmen(props.formation),
    queryFn: () =>
      $api.docs.searchChairmen({ query: { formation: props.formation } }).then(({ data = null }) => data),
  });

export function useCreateAgendaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      sessionId: string;
      sessionMeetingDate: PlainDateOnly;
      date: PlainDateOnly;
      nominationFileIds: string[];
      chairmanId: string;
    }) =>
      $api.docs
        .createAgenda({
          path: { sessionId: command.sessionId },
          body: {
            nominationFileIds: command.nominationFileIds,
            date: command.date,
            sessionMeetingDate: command.sessionMeetingDate,
            chairmanId: command.chairmanId,
          },
        })
        .then(({ data }) => data!),

    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
      });
    },
  });
}

export const useDetailsAgendaMetadataQuery = (query: { agendaId: string | undefined | null }) =>
  useQuery({
    enabled: !!query.agendaId,
    queryKey: agendaKeys.detailsAgendaMetadata(query),
    queryFn: async () => {
      if (!query.agendaId) return;

      const { data = null } = await $api.docs.detailsAgendaMetadata({
        path: { agendaId: query.agendaId },
      });
      return data;
    },
  });

export function useUpdateAgendaMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      agendaId: string;
      sessionMeetingDate: PlainDateOnly;
      date: PlainDateOnly;
      nominationFileIds: string[];
      chairmanId: string;
    }) =>
      $api.docs
        .updateAgenda({
          path: { agendaId: command.agendaId },
          body: {
            nominationFileIds: command.nominationFileIds,
            date: command.date,
            sessionMeetingDate: command.sessionMeetingDate,
            chairmanId: command.chairmanId,
          },
        })
        .then(({ data }) => data!),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
      });
    },
  });
}

export const useAgendaHtmlQuery = (query: { id: string | undefined; force?: boolean }) =>
  useQuery({
    enabled: !!query.id,
    queryKey: agendaKeys.agendaHtml(query.id ?? ''),
    queryFn: () =>
      $api.docs
        .generateAgendaHtml({
          path: { agendaId: query.id! },
          query: { force: query.force },
          parseAs: 'text',
        })
        .then(({ data }) => (data ?? null) as string | null),
  });

export function useGenerateAgendaPdfMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: { agendaId: string; sessionId: string; force?: boolean }) =>
      $api.docs
        .generateAgendaPdf({
          path: { agendaId: command.agendaId },
          query: { force: command.force },
          parseAs: 'stream',
        })
        .then(({ response }) => response.body?.cancel()),

    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findSessionDocs(sessionId),
      }),
  });
}

export const useFindAgendaNominationFilesQuery = (query: {
  sessionId: string;
  ignoreAgendaId: string | null;
}) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: agendaKeys.findAgendaNominationFiles({
      sessionId: query.sessionId,
      ignoreAgendaId: query.ignoreAgendaId ?? undefined,
    }),
    queryFn: () =>
      $api.docs
        .findAgendaNominationFiles({
          path: { sessionId: query.sessionId },
          query: { ignoreAgendaId: query.ignoreAgendaId ?? undefined },
        })
        .then(({ data = null }) => data),
  });

export const useFindSessionDocsQuery = (query: { sessionId: string }) =>
  useQuery({
    queryKey: agendaKeys.findSessionDocs(query.sessionId),
    queryFn: () =>
      $api.docs
        .findSessionDocs({ path: { sessionId: query.sessionId }, priority: 'low' })
        .then(({ data = null }) => data),
  });

export const useDetailsSessionAgendaMutation = () =>
  useMutation({
    mutationFn: (command: { sessionId: string; agendaId: string }) =>
      $api.docs
        .detailsSessionAgenda({
          path: { sessionId: command.sessionId, agendaId: command.agendaId },
        })
        .then(({ data }) => data!),
  });

export const useDetailsSessionOfficialReportsMutation = () =>
  useMutation({
    mutationFn: (command: { sessionId: string; officialReportId: string }) =>
      $api.docs
        .detailsSessionOfficialReport({
          path: { sessionId: command.sessionId, officialReportId: command.officialReportId },
        })
        .then(({ data }) => data!),
  });

export const useIsSessionReadyForDocGenerationQuery = (query: { sessionId: string }) =>
  useQuery({
    queryKey: agendaKeys.isSessionReadyForDocGeneration(query.sessionId),
    queryFn: () =>
      $api.docs
        .isSessionReadyForDocGeneration({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data),
  });

export function useDeleteAgenda(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { agendaId: string }) =>
      $api.docs.deleteAgenda({ path: { agendaId: mutation.agendaId } }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.isSessionReadyForDocGeneration(sessionId),
      });
    },
  });
}

export const officialReportKeys = {
  listAgendas: (sessionId: string) => ['officialReport', 'listAgendas', sessionId] as const,
  listMembers: (sessionId: string) => ['officialReport', 'listMembers', sessionId] as const,
  listSecretaries: () => ['officialReport', 'listSecretaries'] as const,
  findJusticeContacts: (query: { search?: string } = {}) => [
    'officialReport',
    'findJusticeContact',
    query.search ? { search: query.search } : undefined,
  ],
  officialReportHtml: (id: string) => ['officialReport', 'officialReportHtml', id] as const,
  details: (officialReportId: string | undefined | null) =>
    ['officialReport', 'details', officialReportId ?? undefined] as const,
};

export const useListAgendasForNewOfficialReportQuery = (query: {
  sessionId: string;
  ignoreOfficialReportId?: string;
}) =>
  useQuery({
    queryKey: officialReportKeys.listAgendas(query.sessionId),
    queryFn: () =>
      $api.docs
        .listAgendasForNewOfficialReport({
          path: { sessionId: query.sessionId },
          query: { ignoreOfficialReportId: query.ignoreOfficialReportId },
        })
        .then(({ data = null }) => data),
  });

export const useListMembersForNewOfficialReportQuery = (query: { sessionId: string }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.listMembers(query.sessionId),
    queryFn: () =>
      $api.docs
        .listMembersForNewOfficialReport({ path: { sessionId: query.sessionId } })
        .then(({ data = null }) => data),
  });

export const useListSecretariesGeneralQuery = () =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.listSecretaries(),
    queryFn: () => $api.docs.listSecretariesGeneral().then(({ data = null }) => data),
  });

export const useFindJusticeContacts = (query: { search: string | undefined }) =>
  useQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: officialReportKeys.findJusticeContacts(query),
    queryFn: () =>
      $api.docs
        .searchOfficialReportJusticeContact({
          query: { search: query.search },
        })
        .then(({ data = null }) => data),
  });

export function useCreateJusticeContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: { name: string }) =>
      $api.docs
        .createOfficialReportJusticeContact({ body: { name: command.name } })
        .then(({ data = null }) => data),

    onSuccess(data) {
      if (!data) return;

      return queryClient.setQueryData(
        officialReportKeys.findJusticeContacts(),
        (justiceContacts: FoundJusticeContactsDto) => {
          if (!justiceContacts) return undefined;

          const { items } = justiceContacts;
          if (!items.some((item) => item.id === data.id)) {
            return { items: items.concat(data) };
          }

          return { items: items.map((item) => (item.id === data.id ? data : item)) };
        },
      );
    },
  });
}

export function useCreateOfficialReportMutation() {
  return useMutation({
    mutationFn: (command: {
      sessionId: string;
      sessionMeetingDate: { year: number; month: number; day: number };
      sessionMeetingTime: { hours: number; minutes?: number };
      hasRenunciation: boolean;
      justiceDepartmentContactId: string;
      chairmanId: string;
      secretaryId: string;
      agendas: string[];
      members: string[];
    }) =>
      $api.docs
        .createOfficialReport({
          path: { sessionId: command.sessionId },
          body: {
            sessionMeetingDate: command.sessionMeetingDate,
            sessionMeetingTime: command.sessionMeetingTime,
            hasRenunciation: command.hasRenunciation,
            justiceDepartmentContactId: command.justiceDepartmentContactId,
            chairmanId: command.chairmanId,
            secretaryId: command.secretaryId,
            agendas: command.agendas as [string, ...string[]],
            members: command.members as [string, ...string[]],
          },
        })
        .then(({ data }) => data!),
  });
}

export const useOfficialReportHtmlQuery = (query: { id: string | undefined; force?: boolean }) =>
  useQuery({
    enabled: !!query.id,
    queryKey: officialReportKeys.officialReportHtml(query.id ?? ''),
    queryFn: () =>
      $api.docs
        .generateOfficialReportHtml({
          path: { officialReportId: query.id! },
          query: { force: query.force },
          parseAs: 'text',
        })
        .then(({ data }) => (data ?? null) as string | null),
  });

export function useGenerateOfficialReportPdfMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: { officialReportId: string; sessionId: string; force?: boolean }) =>
      $api.docs
        .generateOfficialReportPdf({
          path: { officialReportId: command.officialReportId },
          query: { force: command.force },
          parseAs: 'stream',
        })
        .then(({ response }) => response.body?.cancel()),

    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: agendaKeys.findSessionDocs(sessionId),
      }),
  });
}

export function useDeleteOfficialReportMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { officialReportId: string }) =>
      $api.docs.deleteOfficialReport({ path: { officialReportId: mutation.officialReportId } }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({
        queryKey: agendaKeys.isSessionReadyForDocGeneration(sessionId),
      });
    },
  });
}

export const useDetailsOfficialReportQuery = (query: { officialReportId: string | undefined | null }) =>
  useQuery({
    enabled: !!query.officialReportId,
    queryKey: officialReportKeys.details(query.officialReportId),
    queryFn: async () => {
      if (!query.officialReportId) return;

      const { data = null } = await $api.docs.detailsOfficialReport({
        path: { officialReportId: query.officialReportId },
      });
      return data;
    },
  });

export function useUpdateOfficialReportMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (command: {
      officialReportId: string;
      sessionMeetingDate: { year: number; month: number; day: number };
      sessionMeetingTime: { hours: number; minutes?: number };
      hasRenunciation: boolean;
      justiceDepartmentContactId: string;
      chairmanId: string;
      secretaryId: string;
      agendas: string[];
      members: string[];
    }) =>
      $api.docs
        .updateOfficialReport({
          path: { officialReportId: command.officialReportId },
          body: {
            sessionMeetingDate: command.sessionMeetingDate,
            sessionMeetingTime: command.sessionMeetingTime,
            hasRenunciation: command.hasRenunciation,
            justiceDepartmentContactId: command.justiceDepartmentContactId,
            chairmanId: command.chairmanId,
            secretaryId: command.secretaryId,
            agendas: command.agendas as [string, ...string[]],
            members: command.members as [string, ...string[]],
          },
        })
        .then(({ data }) => data!),

    onSuccess: (_, { officialReportId }) => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId) });
      queryClient.invalidateQueries({ queryKey: officialReportKeys.details(officialReportId) });
    },
  });
}

export const presentationPlanKeys = {
  planMetadata: (query: { id: string | undefined | null }) =>
    ['justicePresentationPlan', 'metadata', query.id ?? undefined] as const,
  planHtml: (query: { id: string | undefined | null }) =>
    ['justicePresentationPlan', 'html', query.id ?? undefined] as const,
  planAgendas: (query: { ignore: string | null | undefined }) =>
    ['justicePresentationPlan', 'agendas', query.ignore || undefined] as const,
  nonPresented: () => ['justicePresentationPlan', 'nonPresented'] as const,
  presented: (query: { pageIndex?: number; pageSize?: number } = {}) =>
    ['justicePresentationPlan', 'presented', query.pageIndex, query.pageSize] as const,
};

export const useListPresentationPlansAgendasQuery = (
  options: { ignorePlanId?: string | undefined | null } = {},
) =>
  useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,

    queryKey: presentationPlanKeys.planAgendas({ ignore: options.ignorePlanId }),
    queryFn: async () => {
      const { data = null } = await $api.docs.listPresentationPlanAgendas({
        query: { ignore: options.ignorePlanId ?? undefined },
      });
      return data;
    },
  });

export function useCreateJusticePresentationPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      chairmanId: string;
      secretaryId: string;
      justiceContactId: string;
      agendas: { id: string; comment: string | null }[];
      date: { year: number; month: number; day: number };
      time: { hours: number; minutes: number };
    }) =>
      $api.docs.createJusticePresentationPlan({
        body: body,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.nonPresented() }),
        queryClient.invalidateQueries({
          queryKey: presentationPlanKeys.planAgendas({ ignore: undefined }),
        }),
      ]),
  });
}

export function useUpdateJusticePresentationPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      id: string;
      chairmanId: string;
      secretaryId: string;
      justiceContactId: string;
      agendas: { id: string; comment: string | null }[];
      date: { year: number; month: number; day: number };
      time: { hours: number; minutes: number };
    }) =>
      $api.docs.updateJusticePresentationPlan({
        body,
        path: { planId: body.id },
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.nonPresented() }),
        queryClient.invalidateQueries({
          queryKey: presentationPlanKeys.planAgendas({ ignore: undefined }),
        }),
      ]),
  });
}

export const useJusticePresentationPlanMetadataQuery = (options: {
  presentationPlanId: string | undefined | null;
}) =>
  useQuery({
    enabled: !!options.presentationPlanId,
    queryKey: presentationPlanKeys.planMetadata({ id: options.presentationPlanId }),
    queryFn: async () => {
      if (!options.presentationPlanId) return null;
      const { data = null } = await $api.docs.detailsPresentationPlanMetadata({
        path: { planId: options.presentationPlanId },
      });

      return data;
    },
  });

export const useJusticePresentationPlanHtmlQuery = (options: {
  presentationPlanId: string | undefined | null;
  force?: boolean;
}) =>
  useQuery({
    enabled: !!options.presentationPlanId,
    queryKey: presentationPlanKeys.planHtml({ id: options.presentationPlanId }),
    queryFn: async () => {
      if (!options.presentationPlanId) return null;

      const { data = null } = await $api.docs.generatePresentationPlanHtml({
        query: { force: options.force },
        path: { planId: options.presentationPlanId },
      });

      return data as string | null;
    },
  });

export function useJusticePresentationPlanPdfMutation() {
  return useMutation({
    mutationFn: async (options: { presentationPlanId: string }) =>
      $api.docs
        .generatePresentationPlanPdf({
          path: { planId: options.presentationPlanId },
          parseAs: 'stream',
        })
        .then(({ response }) => response.body?.cancel()),
  });
}

export function useDeleteJusticePresentationPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: { presentationPlanId: string }) =>
      $api.docs.deleteJusticePresentationPlan({ path: { planId: mutation.presentationPlanId } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.nonPresented() }),
        queryClient.invalidateQueries({
          queryKey: presentationPlanKeys.planAgendas({ ignore: undefined }),
        }),
      ]),
  });
}

export function usePresentPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { presentationPlanId: string }) =>
      $api.docs.presentPlan({ path: { planId: mutation.presentationPlanId } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.presented() }),
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.nonPresented() }),
        queryClient.invalidateQueries({
          queryKey: presentationPlanKeys.planAgendas({ ignore: undefined }),
        }),
      ]),
  });
}

export function useUnPresentPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutation: { presentationPlanId: string }) =>
      $api.docs.unPresentPlan({ path: { planId: mutation.presentationPlanId } }),

    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.presented() }),
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.nonPresented() }),
        queryClient.invalidateQueries({
          queryKey: presentationPlanKeys.planAgendas({ ignore: undefined }),
        }),
      ]),
  });
}

export const useListNonPresentedPlansQuery = () =>
  useQuery({
    staleTime: Infinity,

    queryKey: presentationPlanKeys.nonPresented(),
    queryFn: async () => {
      const { data = null } = await $api.docs.listNonPresentedPlans();
      return data;
    },
  });

export const useListPresentedPlansQuery = (query: Partial<{ pageIndex: number; pageSize: number }> = {}) =>
  useQuery({
    staleTime: Infinity,

    queryKey: presentationPlanKeys.presented(query),
    queryFn: async () => {
      const { data = null } = await $api.docs.listPresentedPlans({
        query: { page: (query.pageIndex ?? 0) + 1, limit: query.pageSize },
      });

      return data;
    },
  });

export function useOpenJusticePresentationPlanPdfDocumentMutation() {
  const tab = useTab();
  return useMutation({
    mutationFn: async (mutation: { planId: string }) => {
      const { data } = await $api.docs.detailsJusticePresentationPlanPdfDocument({
        path: { planId: mutation.planId },
      });

      if (!data) return;
      tab.open(data.url);
    },
  });
}
