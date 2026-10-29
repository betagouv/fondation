import { getSchema } from '@tiptap/core';
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
      '<p>Avant</p><aside class="fr-callout fr-icon-lightbulb-line"><p><strong>À savoir</strong> : un rapporteur</p></aside><p>Après</p>',
    );
  });

  it('keeps a text that follows the opening marker', () => {
    expect(pasted('<p>&lt;aside&gt; Attention</p><p>&lt;/aside&gt;</p>')).toBe(
      '<aside class="fr-callout fr-icon-lightbulb-line"><p>Attention</p></aside>',
    );
  });

  it('leaves a paste without markers untouched', () => {
    expect(pasted('<p>Un</p><p>Deux</p>')).toBeNull();
  });
});
