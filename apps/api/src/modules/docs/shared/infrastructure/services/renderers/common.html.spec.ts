import { describe, expect, it } from 'vitest';

import { commonDocumentCss } from './common.html';

describe('commonDocumentCss', () => {
  it('carries the seven faces the documents use, inlined', () => {
    const css = commonDocumentCss();
    expect(css.match(/@font-face/g)).toHaveLength(7);
    expect(css.match(/url\(data:font\/woff2;base64,/g)).toHaveLength(7);
  });
});
