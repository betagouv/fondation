import type { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { apiFetch, HttpException } from '../../../utils/api-fetch.utils';
import { useQuery } from '@tanstack/react-query';

export function createNominationSessionFromLodam(input: {
  file: File;
  name: string;
  date: string;
  formation: Magistrat.Formation;
  dueDate?: string | null | undefined;
  positionStartDate?: string | null | undefined;
  observationClosingDate: string;
}) {
  const { file, ...form } = input;

  const formData = new FormData();
  formData.set('file', file);
  formData.set('form', new Blob([JSON.stringify(form)], { type: 'application/json' }));

  return apiFetch<{ id: string }>(`/sessions/v2/lodam`, { body: formData, method: 'POST' }).catch(
    async (err) => {
      if (err instanceof HttpException && err.statusCode === 400) {
        const { validationErrors } = await err.response.json();
        throw Object.assign(new Error(), { validationErrors });
      }

      throw err;
    }
  );
}

export function updateNominationSessionObserversFromLodam(input: { file: File; sessionId: string }) {
  const formData = new FormData();
  formData.set('file', input.file);

  return apiFetch<void>(`/sessions/v2/lodam/${input.sessionId}/observers`, {
    method: 'POST',
    body: formData
  }).catch(async (err) => {
    if (err instanceof HttpException && err.statusCode === 400) {
      const { validationErrors } = await err.response.json();
      throw Object.assign(new Error(), { validationErrors });
    }

    throw err;
  });
}

export function addNominationSessionAttachmentMutation(input: { sessionId: string; file: File }) {
  const formData = new FormData();
  formData.set('file', input.file);

  return apiFetch<void>(`/sessions/v2/${input.sessionId}/attachments`, { method: 'PUT', body: formData });
}

export async function removeNominationSessionAttachmentMutation(input: {
  sessionId: string;
  fileId: string;
}): Promise<void> {
  await apiFetch<void>(`/sessions/v2/${input.sessionId}/attachments/${input.fileId}`, {
    method: 'DELETE'
  });
}

export function listNominationSessionAttachmentsQuery(input: {
  sessionId: string;
}): Promise<{ items: { id: string; name: string }[] } | null> {
  return apiFetch<{ items: { id: string; name: string }[] }>(`/sessions/v2/${input.sessionId}/attachments`, {
    method: 'GET'
  });
}

export function useListNominationSessionAttachmentsQuery(props: { sessionId: string }) {
  return useQuery({
    queryKey: ['list-nomination-session-attachments', props.sessionId],
    queryFn: () => listNominationSessionAttachmentsQuery({ sessionId: props.sessionId }),
    placeholderData: (prev) => prev
  });
}

export function createNominationSessionAttachmentUrlMutation(input: {
  sessionId: string;
  fileId: string;
}): Promise<{ id: string; name: string; url: string } | null> {
  return apiFetch<{ id: string; name: string; url: string }>(
    `/sessions/v2/${input.sessionId}/attachments/${input.fileId}`,
    { method: 'GET' }
  );
}

export async function removeNominationSessionAttachmentUrlMutation(input: {
  sessionId: string;
  fileId: string;
}): Promise<void> {
  await apiFetch<void>(`/sessions/v2/${input.sessionId}/attachments/${input.fileId}`, { method: 'DELETE' });
}

export async function updateNominationSessionMutation(input: {
  sessionId: string;
  data: {
    name: string;
    formation: Magistrat.Formation;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  };
}) {
  await apiFetch<void>(`/sessions/v2/${input.sessionId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: input.data.name.toString(),
      formation: input.data.formation.toString(),
      date: input.data.date,
      observationsClosingDate: input.data.observationsClosingDate,
      dueDate: input.data.dueDate ?? null,
      positionStartDate: input.data.positionStartDate ?? null
    })
  });
}

export type ListedNominationSession = {
  id: string;
  name: string;
  formation: Magistrat.Formation;
  date: DateOnlyJson;
  dueDate: DateOnlyJson | null;
  typeDeSaisine: TypeDeSaisine;
};
export function listGdsNominationSessionsQuery() {
  return apiFetch<{ items: ListedNominationSession[] }>(`/sessions/v2/garde-des-sceaux`, {
    method: 'GET'
  });
}

export type DetailedNominationSession = {
  id: string;
  name: string;
  formation: Magistrat.Formation;
  date: DateOnlyJson;
  observationsClosingDate: DateOnlyJson;
  dueDate: DateOnlyJson | null;
  positionStartDate: DateOnlyJson | null;
  typeDeSaisine: TypeDeSaisine;
};
export function detailNominationSessionQuery(input: { sessionId: string | undefined }) {
  return apiFetch<DetailedNominationSession>(`/sessions/v2/${input.sessionId}`, { method: 'GET' });
}
