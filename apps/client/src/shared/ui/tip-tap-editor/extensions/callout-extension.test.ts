import { Editor, getSchema } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { DOMParser, DOMSerializer } from '@tiptap/pm/model';
import { describe, expect, it } from 'vitest';

import { Callout, wrapNotionCallouts } from './callout-extension';

const schema = getSchema([Document, Paragraph, Text, Bold, Callout]);

function pasted(html: string): string | null {
  const { body } = new window.DOMParser().parseFromString(html, 'text/html');
  const wrapped = wrapNotionCallouts(
    DOMParser.fromSchema(schema).parse(body).content,
    schema.nodes['callout']!,
  );
  if (!wrapped) return null;

  const container = document.createElement('div');
  container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(wrapped));
  return container.innerHTML;
}

describe('wrapNotionCallouts', () => {
  it('wraps what Notion pastes between its aside markers, dropping the pictogram of the block', () => {
    expect(
      pasted(
        '<p>Avant</p><p>&lt;aside&gt; 💡</p><p></p><p><strong>À savoir</strong> : un rapporteur</p><p></p><p>&lt;/aside&gt;</p><p>Après</p>',
      ),
    ).toBe(
      '<p>Avant</p><aside data-kind="tip" class="fr-callout fr-icon-lightbulb-line"><p><strong>À savoir</strong> : un rapporteur</p></aside><p>Après</p>',
    );
  });

  it('keeps a text that follows the opening marker', () => {
    expect(pasted('<p>&lt;aside&gt; Un rapporteur</p><p>&lt;/aside&gt;</p>')).toBe(
      '<aside data-kind="tip" class="fr-callout fr-icon-lightbulb-line"><p>Un rapporteur</p></aside>',
    );
  });

  it('makes a warning of a Notion callout that opens on an alert pictogram or on "Attention"', () => {
    expect(pasted('<p>&lt;aside&gt; ⚠️</p><p>Vérifier les liens</p><p>&lt;/aside&gt;</p>')).toBe(
      '<aside data-kind="warning" class="fr-callout fr-callout--orange-terre-battue fr-icon-warning-line"><p>Vérifier les liens</p></aside>',
    );
    expect(
      pasted('<p>&lt;aside&gt; 💡</p><p><strong>Attention</strong> : lecture seule</p><p>&lt;/aside&gt;</p>'),
    ).toBe(
      '<aside data-kind="warning" class="fr-callout fr-callout--orange-terre-battue fr-icon-warning-line"><p><strong>Attention</strong> : lecture seule</p></aside>',
    );
  });

  it('leaves a paste without markers untouched', () => {
    expect(pasted('<p>Un</p><p>Deux</p>')).toBeNull();
  });
});

describe('Callout', () => {
  const extensions = [Document, Paragraph, Text, Bold, Callout];
  const editorWith = (content: string) => new Editor({ content, extensions });

  it('opens a callout of its kind on the paragraph, under its title in bold', () => {
    const editor = editorWith('<p>Un rapporteur par dossier</p>');

    editor.commands.toggleCallout({ kind: 'warning', title: 'Attention' });

    expect(editor.getHTML()).toBe(
      '<aside data-kind="warning" class="fr-callout fr-callout--orange-terre-battue fr-icon-warning-line"><p><strong>Attention</strong></p><p>Un rapporteur par dossier</p></aside>',
    );
  });

  it('turns a callout into the other kind and keeps its content', () => {
    const editor = editorWith('<aside data-kind="tip"><p>Un rapporteur par dossier</p></aside>');

    editor.commands.toggleCallout({ kind: 'warning', title: 'Attention' });

    expect(editor.getHTML()).toBe(
      '<aside data-kind="warning" class="fr-callout fr-callout--orange-terre-battue fr-icon-warning-line"><p>Un rapporteur par dossier</p></aside>',
    );
  });

  it('makes a warning of a callout written before the kinds that opens on "Attention"', () => {
    expect(editorWith('<aside><p><strong>Attention</strong> : lecture seule</p></aside>').getHTML()).toBe(
      '<aside data-kind="warning" class="fr-callout fr-callout--orange-terre-battue fr-icon-warning-line"><p><strong>Attention</strong> : lecture seule</p></aside>',
    );
  });

  it('takes a callout written before the kinds for a "bon à savoir" one', () => {
    expect(editorWith('<aside><p>À savoir</p></aside>').getHTML()).toBe(
      '<aside data-kind="tip" class="fr-callout fr-icon-lightbulb-line"><p>À savoir</p></aside>',
    );
  });
});
