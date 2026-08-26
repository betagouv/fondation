const FILE_SIZE_UNITS = ['o', 'Ko', 'Mo', 'Go'] as const;
const KEEP_URL_ALIVE_FOR_THE_DOWNLOAD_MS = 1_000;

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 o';

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), FILE_SIZE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const maximumFractionDigits = exponent >= FILE_SIZE_UNITS.indexOf('Mo') ? 1 : 0;
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(value);

  return `${formatted} ${FILE_SIZE_UNITS[exponent]}`;
}

export function splitFileName(name: string): { label: string; extension: string | null } {
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) return { label: name, extension: null };

  return { label: name.slice(0, lastDot), extension: name.slice(lastDot + 1) };
}

function decodedOrNull(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function fileNameFromResponse(response: Response | undefined, fallback: string): string {
  const disposition = response?.headers.get('content-disposition') ?? '';
  const quoted = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];

  return (encoded ? decodedOrNull(encoded) : null) ?? quoted ?? fallback;
}

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);

  const $a = document.createElement('a');
  $a.href = url;
  $a.download = fileName;
  $a.style.display = 'none';

  document.body.appendChild($a);
  $a.click();
  $a.remove();

  setTimeout(() => URL.revokeObjectURL(url), KEEP_URL_ALIVE_FOR_THE_DOWNLOAD_MS);
}
