import { getSchema } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { describe, expect, it } from 'vitest';

import { htmlThroughSchema } from './tiptap-node-to-html';

const schema = getSchema([Document, Paragraph, Text, Bold]);

describe('htmlThroughSchema', () => {
  it('keeps what the editor writes', () => {
    expect(htmlThroughSchema('<p><strong>MME Ada LOVELACE</strong>, au rapport de</p>', schema)).toBe(
      '<p><strong>MME Ada LOVELACE</strong>, au rapport de</p>',
    );
  });

  it('drops the scripts and the handlers the schema cannot hold', () => {
    const html = htmlThroughSchema(
      '<p onclick="alert(1)">Ada<img src=x onerror="alert(1)"><script>alert(1)</script></p>',
      schema,
    );

    expect(html).toBe('<p>Ada</p>');
  });
});
