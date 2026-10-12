import assert from 'node:assert/strict';
import { test } from 'node:test';

import { documentLogo, missingDocumentFonts } from '../src/index';

test('the letterhead is available', () => {
  assert.match(documentLogo(), /^<svg/);
});

test('every face the documents use is present', () => {
  assert.deepEqual(
    missingDocumentFonts(),
    [],
    'drop the missing woff2 in packages/documents-assets/assets/fonts, see its README',
  );
});
