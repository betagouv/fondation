import { InvalidFileName, renamedFileName } from './file-name';

describe('renamedFileName', () => {
  it('keeps the extension the file was added with', () => {
    expect(renamedFileName('scan_0042.pdf', 'Avis du chef de cour')).toBe('Avis du chef de cour.pdf');
  });

  it('keeps an extension the user typed as part of the name', () => {
    expect(renamedFileName('note.docx', 'note.pdf')).toBe('note.pdf.docx');
  });

  it('leaves a file without extension without one', () => {
    expect(renamedFileName('.bashrc', 'notes')).toBe('notes');
    expect(renamedFileName('LISEZMOI', 'notes')).toBe('notes');
  });

  it('trims the spaces around the name', () => {
    expect(renamedFileName('note.pdf', '  Avis  ')).toBe('Avis.pdf');
  });

  it('refuses an empty name', () => {
    expect(() => renamedFileName('note.pdf', '   ')).toThrow(InvalidFileName);
  });

  it('refuses a control character, which nobody types', () => {
    expect(() => renamedFileName('note.pdf', 'a\u0000b')).toThrow(InvalidFileName);
    expect(() => renamedFileName('note.pdf', 'a\nb')).toThrow(InvalidFileName);
  });

  it('counts the extension in the 255 characters a name holds', () => {
    expect(renamedFileName('note.pdf', 'a'.repeat(251))).toHaveLength(255);
    expect(() => renamedFileName('note.pdf', 'a'.repeat(252))).toThrow(InvalidFileName);
  });

  it('keeps any character the user types', () => {
    expect(renamedFileName('note.pdf', 'Avis n°2 / CA d’Aix : « réservé »')).toBe(
      'Avis n°2 / CA d’Aix : « réservé ».pdf',
    );
  });
});
