import { describe, expect, it } from 'vitest';

import { containsImage, toPlainText } from './summary-text';

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

  it('is empty when the summary only holds images', () => {
    expect(toPlainText('<p><img src="blob:profil" alt="" /></p>')).toBe('');
  });
});

describe('containsImage', () => {
  it('detects an image in the summary', () => {
    expect(containsImage('<p><img src="blob:profil" alt="" /></p>')).toBe(true);
  });

  it('detects nothing in a text-only summary', () => {
    expect(containsImage('<p>Magistrate expérimentée.</p>')).toBe(false);
  });

  it('detects nothing in an empty summary', () => {
    expect(containsImage('')).toBe(false);
  });

  it('is not fooled by the word image in the text', () => {
    expect(containsImage('<p>Une image vaut mille mots</p>')).toBe(false);
  });
});
