/** parses the stored html apart from the page: an image of the page would load and run its handlers */
export function withScreenshotUrls(
  html: string,
  screenshots: readonly { id: string; name: string; url: string }[],
): string {
  const byId = new Map(screenshots.map((s) => [s.id, s]));
  const byName = new Map(screenshots.map((s) => [s.name, s]));

  const { body } = new DOMParser().parseFromString(html, 'text/html');
  for (const $img of body.querySelectorAll('img')) {
    const screenshot =
      ($img.dataset.fileId && byId.get($img.dataset.fileId)) ||
      ($img.dataset.fileName && byName.get($img.dataset.fileName));
    if (!screenshot) continue;

    $img.dataset.fileId = screenshot.id;
    $img.dataset.fileName = screenshot.name;
    $img.src = screenshot.url;
  }

  return body.innerHTML;
}
