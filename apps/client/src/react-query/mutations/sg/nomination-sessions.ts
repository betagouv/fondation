import type { Magistrat } from 'shared-models';
import { apiFetch } from '../../../utils/api-fetch.utils';

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

  return apiFetch<{ id: string }>(`/sessions/v2/lodam`, { body: formData, method: 'POST' });
}

export function updateNominationSessionObserversFromLodam(input: { file: File; sessionId: string }) {
  const formData = new FormData();
  formData.set('file', input.file);

  return apiFetch<void>(`/sessions/v2/lodam/${input.sessionId}/observers`, {
    method: 'POST',
    body: formData
  });
}
