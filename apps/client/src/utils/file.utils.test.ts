import { describe, expect, it } from 'vitest';

import { formatFileSize, splitFileName } from './file.utils';

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 o');
    expect(formatFileSize(512)).toBe('512 o');
  });

  it('scales to the right unit with french formatting', () => {
    expect(formatFileSize(1024)).toBe('1 Ko');
    expect(formatFileSize(63360)).toBe('61,88 Ko');
    expect(formatFileSize(1024 * 1024)).toBe('1 Mo');
  });
});

describe('splitFileName', () => {
  it('splits the extension from the label', () => {
    expect(splitFileName('candidature-piece-jointe.pdf')).toEqual({
      label: 'candidature-piece-jointe',
      extension: 'pdf',
    });
  });

  it('splits on the last dot', () => {
    expect(splitFileName('rapport.final.pdf')).toEqual({ label: 'rapport.final', extension: 'pdf' });
  });

  it('handles names without extension', () => {
    expect(splitFileName('candidature')).toEqual({ label: 'candidature', extension: null });
    expect(splitFileName('.gitignore')).toEqual({ label: '.gitignore', extension: null });
  });
});
