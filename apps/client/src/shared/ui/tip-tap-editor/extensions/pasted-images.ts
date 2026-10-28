// Notion pastes its images as `attachment:` references, which never load and lose their source on saving
export function withoutUnreachableImages(html: string): { dropped: number; html: string } {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const unreachable = [...document.querySelectorAll('img')].filter(
    (image) => !/^https?:$/.test(URL.parse(image.getAttribute('src') ?? '')?.protocol ?? ''),
  );
  if (unreachable.length === 0) return { dropped: 0, html };

  for (const image of unreachable) image.remove();
  return { dropped: unreachable.length, html: document.body.innerHTML };
}
