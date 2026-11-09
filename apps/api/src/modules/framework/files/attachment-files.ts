import z from 'zod';

import { ATTACHMENT_MAX_BYTES } from './attachment-max-bytes';
import { FILE_MIME_TYPES } from './mime-type';

/**
 * Only PDFs and images are sanitized: any other format reaches the storage untouched, so it is accepted
 * only when refusing it would turn away people who have no other tool
 */
const ATTACHMENT_MIME_TYPES = [
  FILE_MIME_TYPES.pdf,
  FILE_MIME_TYPES.png,
  FILE_MIME_TYPES.jpg,
  FILE_MIME_TYPES.doc,
  FILE_MIME_TYPES.docx,
];

/** The files a user attaches to a session, a dossier, a report or an observation */
export function attachmentFiles() {
  // like the other file DTOs, the pipe keeps the content types out of the input schema the client is generated from
  return z.array(z.file().max(ATTACHMENT_MAX_BYTES)).pipe(z.array(z.file().mime(ATTACHMENT_MIME_TYPES)));
}
