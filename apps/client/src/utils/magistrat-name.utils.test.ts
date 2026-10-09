import { describe, expect, it } from 'vitest';

import { splitNameEnd } from './magistrat-name.utils';

describe('splitNameEnd', () => {
  it.each`
    name                                       | start                       | end
    ${'DUPONT DE LA BOISSIÈRE Anne-Charlotte'} | ${'DUPONT DE LA BOISSIÈRE'} | ${'Anne-Charlotte'}
    ${'SKŁODOWSKA Marie (ép. CURIE)'}          | ${'SKŁODOWSKA Marie'}       | ${'(ép. CURIE)'}
    ${'GAUTHIER Isabelle (ép. DE LA ROSE)'}    | ${'GAUTHIER Isabelle'}      | ${'(ép. DE LA ROSE)'}
    ${'Mme SKŁODOWSKA Marie (ép. CURIE)'}      | ${'Mme SKŁODOWSKA Marie'}   | ${'(ép. CURIE)'}
    ${'Mme\u00A0HENRI\u00A0Jean-Charles'}      | ${''}                       | ${'Mme\u00A0HENRI\u00A0Jean-Charles'}
    ${'DUPONT'}                                | ${''}                       | ${'DUPONT'}
  `('should keep $end with the icons', ({ name, start, end }) => {
    expect(splitNameEnd(name)).toEqual({ end, start });
  });
});
