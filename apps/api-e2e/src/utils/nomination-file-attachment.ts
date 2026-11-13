import type { UploadNominationFileAttachmentsDto } from '../generated/api/types.ts';

/** the form travels as a json part of the multipart body, which the generated client types as the object it holds */
export function attachmentForm(
  form: UploadNominationFileAttachmentsDto['form'],
): UploadNominationFileAttachmentsDto['form'] {
  return new Blob([JSON.stringify(form)], {
    type: 'application/json',
  }) as unknown as UploadNominationFileAttachmentsDto['form'];
}
