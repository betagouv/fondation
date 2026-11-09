import { FILE_EXTENSIONS, filenameToMimeType, resolveMimeType } from './mime-type';

describe('resolveMimeType', () => {
  it('keeps the type the browser declares', () => {
    expect(resolveMimeType({ mimetype: 'image/png', originalname: 'scan.pdf' })).toBe('image/png');
  });

  it.each(['', 'application/octet-stream', 'application/x-unknown'])(
    'reads the extension when the browser declares %j',
    (mimetype) => {
      expect(resolveMimeType({ mimetype, originalname: 'note.docx' })).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    },
  );

  it('falls back to the generic type when neither the browser nor the extension tells', () => {
    expect(resolveMimeType({ mimetype: '', originalname: 'archive.rar' })).toBe('application/octet-stream');
  });
});

describe('filenameToMimeType', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['PHOTO.JPEG', 'image/jpeg'],
    ['rapport.PDF', 'application/pdf'],
    ['note.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['agenda.pdf-2026', 'application/pdf'],
    ['courriel.MSG', 'application/vnd.ms-outlook'],
  ])('reads %s as %s', (filename, expected) => {
    expect(filenameToMimeType(filename)).toBe(expected);
  });

  it.each(['archive.rar', 'README', ''])('does not guess a type for %s', (filename) => {
    expect(filenameToMimeType(filename)).toBeUndefined();
  });

  it('keeps jpg as the extension used to name a stored jpeg', () => {
    expect(FILE_EXTENSIONS['image/jpeg']).toBe('jpg');
  });
});
