import { dataFileIdKey, dataFileNameKey } from '@/shared/ui/tip-tap-editor/extensions/constant';

/** parses the stored html apart from the page: an image of the page would load and run its handlers */
export function withScreenshotUrls(
  html: string,
  screenshots: readonly { id: string; name: string; url: string }[],
): string {
  const byId = new Map(screenshots.map((s) => [s.id, s]));
  const byName = new Map(screenshots.map((s) => [s.name, s]));

  const { body } = new DOMParser().parseFromString(html, 'text/html');
  for (const $img of body.querySelectorAll('img')) {
    const fileId = $img.getAttribute(dataFileIdKey);
    const fileName = $img.getAttribute(dataFileNameKey);
    const screenshot = (fileId && byId.get(fileId)) || (fileName && byName.get(fileName));
    if (!screenshot) continue;

    $img.setAttribute(dataFileIdKey, screenshot.id);
    $img.setAttribute(dataFileNameKey, screenshot.name);
    $img.src = screenshot.url;
  }

  return body.innerHTML;
}
