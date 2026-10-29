import { withoutUnreachableImages } from './pasted-images';

describe('withoutUnreachableImages', () => {
  it('takes out an image Notion pastes by reference', () => {
    const pasted = '<p>Étapes</p><p><img src="attachment:10dadeaa:image.png" alt="image.png"></p>';

    expect(withoutUnreachableImages(pasted)).toEqual({ dropped: 1, html: '<p>Étapes</p><p></p>' });
  });

  it('keeps an image served on the web', () => {
    const pasted = '<p><img src="https://example.fr/capture.png"></p>';

    expect(withoutUnreachableImages(pasted)).toEqual({ dropped: 0, html: pasted });
  });
});
