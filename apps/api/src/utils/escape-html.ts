const ESCAPES: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

export function escapeHtml(text: string): string {
  return text.replace(/["&'<>]/g, (char) => ESCAPES[char]!);
}
