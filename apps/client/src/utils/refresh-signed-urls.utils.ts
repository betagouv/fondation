import type { FileVM } from 'shared-models';
import { dataFileNameKey } from '../components/reports/components/ReportOverview/TipTapEditor/extensions';

/**
 * Remplace les URLs signées expirées dans le HTML du commentaire
 * @param comment HTML content du commentaire
 * @param screenshots Liste des screenshots avec fileId
 * @param signedUrlsVM URLs signées fraîches
 * @returns HTML mis à jour avec les nouvelles URLs
 */
export function refreshSignedUrlsInComment(
  comment: string,
  screenshots: Array<{ fileId: string | null; name: string }>,
  signedUrlsVM: FileVM[]
): string {
  if (!comment || screenshots.length === 0) {
    return comment;
  }

  const container = document.createElement('div');
  container.innerHTML = comment;

  const images = container.querySelectorAll('img');

  images.forEach((img) => {
    const imgFileName = img.getAttribute(dataFileNameKey);
    if (!imgFileName) return;

    // Trouver le screenshot correspondant
    const screenshot = screenshots.find((file) => file.name === imgFileName);
    if (!screenshot) {
      console.warn(`Screenshot ${imgFileName} not found`);
      return;
    }

    // Trouver l'URL signée correspondante
    const signedUrlVM = signedUrlsVM.find((file) => file.name === screenshot.name);

    if (signedUrlVM) {
      img.setAttribute('src', signedUrlVM.signedUrl);
    }
  });

  return container.innerHTML;
}

/**
 * Extrait les fileIds des screenshots pour récupérer les URLs signées
 */
export function extractScreenshotFileIds(
  screenshots: Array<{ fileId: string | null; name: string }>
): string[] {
  return screenshots
    .filter((screenshot) => screenshot.fileId !== null)
    .map((screenshot) => screenshot.fileId!);
}
