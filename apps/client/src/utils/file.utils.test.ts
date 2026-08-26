import { describe, expect, it } from 'vitest';

import { fileNameFromResponse, formatFileSize, splitFileName } from './file.utils';

const responseWith = (disposition?: string) =>
  new Response(null, { headers: disposition ? { 'content-disposition': disposition } : {} });

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 o');
    expect(formatFileSize(512)).toBe('512 o');
  });

  it('scales to the right unit with french formatting', () => {
    expect(formatFileSize(1024)).toBe('1 Ko');
    expect(formatFileSize(63360)).toBe('62 Ko');
    expect(formatFileSize(1024 * 1024)).toBe('1 Mo');
    expect(formatFileSize(1.24 * 1024 * 1024)).toBe('1,2 Mo');
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

describe('fileNameFromResponse', () => {
  it('reads the quoted name', () => {
    expect(fileNameFromResponse(responseWith('inline; filename="agenda.pdf"'), 'repli.pdf')).toBe(
      'agenda.pdf',
    );
  });

  it('prefers the extended name over the degraded quoted one', () => {
    const disposition = `attachment; filename="L'?uvre.pdf"; filename*=UTF-8''L%27%C5%93uvre.pdf`;

    expect(fileNameFromResponse(responseWith(disposition), 'repli.pdf')).toBe(`L'œuvre.pdf`);
  });

  it('reads an extended name standing on its own', () => {
    const disposition = `attachment; filename*=UTF-8''L%27%C5%93uvre.pdf`;

    expect(fileNameFromResponse(responseWith(disposition), 'repli.pdf')).toBe(`L'œuvre.pdf`);
  });

  it('falls back rather than fail on a malformed escape', () => {
    const disposition = `attachment; filename*=UTF-8''bad%ZZ.pdf`;

    expect(fileNameFromResponse(responseWith(disposition), 'repli.pdf')).toBe('repli.pdf');
  });

  it('keeps the quoted name when the extended one is unusable', () => {
    const disposition = `attachment; filename="agenda.pdf"; filename*=UTF-8''bad%ZZ.pdf`;

    expect(fileNameFromResponse(responseWith(disposition), 'repli.pdf')).toBe('agenda.pdf');
  });

  it('falls back without a header or without a response', () => {
    expect(fileNameFromResponse(responseWith(), 'repli.pdf')).toBe('repli.pdf');
    expect(fileNameFromResponse(undefined, 'repli.pdf')).toBe('repli.pdf');
  });
});
