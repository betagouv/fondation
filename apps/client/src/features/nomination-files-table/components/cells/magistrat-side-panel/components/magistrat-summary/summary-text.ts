const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre';

export function containsImage(html: string): boolean {
  const { body } = new DOMParser().parseFromString(html, 'text/html');
  return body.querySelector('img') !== null;
}

export function toPlainText(html: string): string {
  const { body } = new DOMParser().parseFromString(html, 'text/html');

  const lines = [...body.querySelectorAll(BLOCK_SELECTOR)]
    .filter((block) => !block.querySelector(BLOCK_SELECTOR))
    .map((block) => {
      const line = (block.textContent ?? '').replace(/\s+/g, ' ').trim();
      return line && block.closest('li') ? `• ${line}` : line;
    })
    .filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : (body.textContent ?? '').trim();
}
