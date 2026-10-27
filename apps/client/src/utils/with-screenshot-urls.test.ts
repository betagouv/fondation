import { afterEach, describe, expect, it, vi } from 'vitest';

import { withScreenshotUrls } from './with-screenshot-urls';

const screenshot = { id: 'file-1', name: 'capture.png', url: 'https://storage.test/capture.png' };

describe('withScreenshotUrls', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('points an image to the url of its screenshot, found by id', () => {
    const html = withScreenshotUrls('<p>Avis</p><img src="https://expired.test" data-file-id="file-1">', [
      screenshot,
    ]);

    expect(html).toBe(
      '<p>Avis</p><img src="https://storage.test/capture.png" data-file-id="file-1" data-file-name="capture.png">',
    );
  });

  it('finds the screenshot of an image saved before its id, by its name', () => {
    const html = withScreenshotUrls('<img data-file-name="capture.png">', [screenshot]);

    expect(html).toBe(
      '<img data-file-name="capture.png" data-file-id="file-1" src="https://storage.test/capture.png">',
    );
  });

  it('points a video to the url of its file the same way', () => {
    const video = { id: 'file-2', name: 'demo.mp4', url: 'https://storage.test/demo.mp4' };

    expect(
      withScreenshotUrls('<video src="https://expired.test" data-file-id="file-2"></video>', [video]),
    ).toBe(
      '<video src="https://storage.test/demo.mp4" data-file-id="file-2" data-file-name="demo.mp4"></video>',
    );
  });

  it('leaves an image without screenshot as it is', () => {
    expect(withScreenshotUrls('<img src="https://example.org/a.png">', [screenshot])).toBe(
      '<img src="https://example.org/a.png">',
    );
  });

  // jsdom loads no image, so an onerror cannot be observed: the test checks where the images live instead
  it('never parses the images in the document of the page', () => {
    const owners: Document[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
      this: HTMLImageElement,
      url,
    ) {
      owners.push(this.ownerDocument);
      descriptor.set!.call(this, url);
    });

    withScreenshotUrls('<img src="x" onerror="alert(1)" data-file-id="file-1">', [screenshot]);

    expect(owners).toHaveLength(1);
    expect(owners[0]).not.toBe(document);
  });
});
