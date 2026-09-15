/**
 * The only formats the API knows how to sanitize: PDFs are flattened through ghostscript,
 * images are stripped of their EXIF metadata. Anything else is stored exactly as uploaded
 */
export const SANITIZED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * No sanitizer handles Word documents yet, so they reach the storage untouched. Accept them only
 * where refusing them would turn away people who have no other tool. Extensions are listed
 * alongside the mime types because file pickers map the Office ones unreliably
 */
const OFFICE_MIME_TYPES = [
  '.doc',
  '.docx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const SANITIZED_FILE_TYPES = SANITIZED_MIME_TYPES.join(',');

/** What every upload point accepts but one: what the API sanitizes, plus the Word documents it does not */
export const DOCUMENT_FILE_TYPES = [...SANITIZED_MIME_TYPES, ...OFFICE_MIME_TYPES].join(',');
