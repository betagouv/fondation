const ASCII_FILENAME = /^[\x20-\x7e]*$/;
const OUTSIDE_LATIN1 = /[^\x20-\x7e\xa0-\xff]/g;
const QUOTED = /["\\]/g;
const OUTSIDE_ATTR_CHAR = /['()*]/g;

const percentEncode = (char: string) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`;

/** @see https://www.rfc-editor.org/rfc/rfc6266#section-4.1 */
export function contentDisposition(props: { download?: boolean; name: string }): string {
  const type = props.download ? 'attachment' : 'inline';

  const fallback = props.name.replace(OUTSIDE_LATIN1, '?').replace(QUOTED, '\\$&');
  if (ASCII_FILENAME.test(props.name)) return `${type}; filename="${fallback}"`;

  const encoded = encodeURIComponent(props.name).replace(OUTSIDE_ATTR_CHAR, percentEncode);
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
