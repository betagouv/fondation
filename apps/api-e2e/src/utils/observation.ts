import type { CreateObservationDto, UpdateObservationDto } from '../generated/api/types.ts';

/** the form travels as a json part of the multipart body, which the generated client types as the object it holds */
export function observationForm<T extends CreateObservationDto['form'] | UpdateObservationDto['form']>(form: T): T {
  return new Blob([JSON.stringify(form)], { type: 'application/json' }) as unknown as T;
}
