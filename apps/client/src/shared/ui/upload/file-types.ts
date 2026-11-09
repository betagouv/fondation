/**
 * The only formats the API knows how to sanitize: PDFs are flattened through ghostscript,
 * images are stripped of their EXIF metadata. Anything else is stored exactly as uploaded
 */
const SANITIZED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * No sanitizer handles Office documents yet, so they reach the storage untouched. Accept one only
 * where refusing it would turn away people who have no other tool: Word documents, Outlook messages
 * and Excel workbooks. Extensions are listed alongside the mime types because file pickers map the
 * Office ones unreliably, and give none to an Outlook message outside Windows
 */
const OFFICE_MIME_TYPES = [
  '.doc',
  '.docx',
  '.msg',
  '.xlsx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-outlook',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const SANITIZED_FILE_TYPES = SANITIZED_MIME_TYPES.join(',');

/** What every upload of attachments accepts but one: what the API sanitizes, plus the Office documents it does not */
export const ATTACHMENT_FILE_TYPES = [...SANITIZED_MIME_TYPES, ...OFFICE_MIME_TYPES].join(',');
