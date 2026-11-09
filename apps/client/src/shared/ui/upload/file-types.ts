/**
 * The only formats the API knows how to sanitize: PDFs are flattened through ghostscript,
 * images are stripped of their EXIF metadata. Anything else is stored exactly as uploaded
 */
const SANITIZED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * No sanitizer handles office documents yet, so they reach the storage untouched. Accept one only
 * where refusing it would turn away people who have no other tool: Word and LibreOffice documents,
 * emails and Excel workbooks. Extensions are listed alongside the mime types because file pickers map
 * the office ones unreliably, and give none to an Outlook message outside Windows
 */
const OFFICE_MIME_TYPES = [
  '.doc',
  '.docx',
  '.odt',
  '.msg',
  '.eml',
  '.xlsx',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-outlook',
  'message/rfc822',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** What every upload of attachments accepts: what the API sanitizes, plus the Office documents it does not */
export const ATTACHMENT_FILE_TYPES = [...SANITIZED_MIME_TYPES, ...OFFICE_MIME_TYPES].join(',');
