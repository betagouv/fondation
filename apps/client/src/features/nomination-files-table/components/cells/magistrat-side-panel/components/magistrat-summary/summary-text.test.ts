import { describe, expect, it } from 'vitest';

import { toPlainText } from './summary-text';

describe('toPlainText', () => {
  it('keeps paragraphs on separate lines', () => {
    expect(toPlainText('<p>Bonjour</p><p>Monde</p>')).toBe('Bonjour\nMonde');
  });

  it('bullets list items wrapped in a paragraph, as the editor produces them', () => {
    expect(toPlainText('<ul><li><p>un</p></li><li><p>deux</p></li></ul>')).toBe('• un\n• deux');
  });

  it('bullets bare list items', () => {
    expect(toPlainText('<ul><li>un</li></ul>')).toBe('• un');
  });

  it('keeps headings and skips empty blocks', () => {
    expect(toPlainText('<h2>Titre</h2><p></p><p>Corps</p>')).toBe('Titre\nCorps');
  });

  it('collapses the whitespace inside a block', () => {
    expect(toPlainText('<p>Une\n  phrase   aérée</p>')).toBe('Une phrase aérée');
  });

  it('falls back to the raw text when the content has no block markup', () => {
    expect(toPlainText('Juste du texte')).toBe('Juste du texte');
  });

  it('is empty when the summary holds no text', () => {
    expect(toPlainText('<p></p>')).toBe('');
  });
});
