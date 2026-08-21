import { FILE_EXTENSIONS, filenameToMimeType } from './mime-type';

describe('filenameToMimeType', () => {
  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['PHOTO.JPEG', 'image/jpeg'],
    ['rapport.PDF', 'application/pdf'],
    ['note.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['agenda.pdf-2026', 'application/pdf'],
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
