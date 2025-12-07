import type { FileVM } from 'shared-models';

/**
 * Remplace les URLs signées expirées dans le HTML du commentaire
 * @param comment HTML content du commentaire
 * @param screenshots Liste des screenshots avec fileId
 * @param signedUrlsVM URLs signées fraîches
 * @returns HTML mis à jour avec les nouvelles URLs
 */
export function refreshSignedUrlsInComment(
  comment: string,
  screenshots: { fileId: string | null; name: string }[],
  signedUrlsVM: readonly FileVM[]
): string {
  if (!comment || screenshots.length === 0) {
    return comment;
  }

  const screenshotsById = new Map(screenshots.filter((s) => !!s.fileId).map((s) => [s.fileId, s]));
  const screenshotsByName = new Map(screenshots.map((s) => [s.name, s]));

  const $container = document.createElement('div');
  $container.innerHTML = comment;

  for (const $img of $container.querySelectorAll('img')) {
    let screenshot: { fileId: string | null; name: string } | undefined;
    if ($img.dataset.fileId) {
      screenshot = screenshotsById.get($img.dataset.fileId);
    }

    if (!screenshot && $img.dataset.fileName) {
      screenshot = screenshotsByName.get($img.dataset.fileName);
    }

    if (screenshot) {
      const signedUrlVM = signedUrlsVM.find((file) => file.name === screenshot.name);
      if (signedUrlVM) {
        $img.setAttribute('src', signedUrlVM.signedUrl);
      }
    } else {
      console.warn(`Screenshot "${$img.dataset.fileName}" not found`);
    }
  }

  return $container.innerHTML;
}
