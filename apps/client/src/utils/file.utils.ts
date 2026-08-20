const FILE_SIZE_UNITS = ['o', 'Ko', 'Mo', 'Go'] as const;

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
