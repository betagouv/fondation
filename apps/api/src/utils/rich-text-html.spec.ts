import { fileIdsReferencedIn, sanitizeRichPageHtml, sanitizeRichTextHtml } from './rich-text-html';

describe('sanitizeRichTextHtml', () => {
  it('keeps what the editor writes as it is', () => {
    const written =
      `<h1>Avis</h1><p><strong>MME Ada LOVELACE</strong>, juge à la cour d'appel&nbsp;: <em>dite</em> <u>de</u> ` +
      `<mark><span style="color: #000091">Paris</span></mark></p><ul><li><p>un</p></li></ul>` +
      `<ol start="3" type="a"><li><p>deux</p></li></ol>` +
      `<img src="https://storage.test/capture.png" alt="capture" title="capture" width="312.5" height="200" ` +
      `data-file-id="file-1" data-file-name="capture.png"><p></p>`;

    expect(sanitizeRichTextHtml(written)).toBe(written);
  });

  it('removes the scripts and the styles with their content', () => {
    expect(sanitizeRichTextHtml(`<p>Ada<script>alert(1)</script><style>p{}</style></p>`)).toBe('<p>Ada</p>');
  });

  it('removes the attributes the editor does not write', () => {
    expect(
      sanitizeRichTextHtml(
        `<p onclick="alert(1)" style="color: red"><img src="https://storage.test/a.png" onerror="alert(1)"></p>`,
      ),
    ).toBe('<p><img src="https://storage.test/a.png"></p>');
  });

  it('keeps only a color in a style', () => {
    expect(
      sanitizeRichTextHtml(
        `<span style="color: rgb(0, 0, 145)">a</span><span style="background: url(javascript:alert(1))">b</span>` +
          `<span style="color: red; background: url(https://evil.test)">c</span>` +
          `<span style="color: expression(alert(1))">d</span>`,
      ),
    ).toBe('<span style="color: rgb(0, 0, 145)">a</span><span>b</span><span>c</span><span>d</span>');
  });

  it('keeps a color pasted from Word, which the editor keeps as written', () => {
    const pasted =
      `<span style="color: black">a</span><span style="color: windowtext">b</span>` +
      `<span style="color: hsl(240, 100%, 28%)">c</span><span style="color: rgb(0 0 145 / 50%)">d</span>`;

    expect(sanitizeRichTextHtml(pasted)).toBe(pasted);
  });

  it('keeps of an image only a source on the web', () => {
    expect(
      sanitizeRichTextHtml(
        `<img src="javascript:alert(1)"><img src="data:image/svg+xml,<svg onload=alert(1)>"><img width="100%" height="1e9">`,
      ),
    ).toBe('<img><img><img>');
  });

  it('keeps only the numbering of a list', () => {
    expect(sanitizeRichTextHtml(`<ol start="2x" type="disc"><li>un</li></ol>`)).toBe('<ol><li>un</li></ol>');
  });

  it('unwraps the tags the editor does not write, down to their text', () => {
    expect(sanitizeRichTextHtml(`<p><font color="red">Ada</font></p><constructor>x</constructor>`)).toBe(
      '<p>Ada</p>x',
    );
    expect(sanitizeRichTextHtml(`<svg><p>Ada</p></svg><math><mi>x</mi></math>`)).toBe('<p>Ada</p>x');
  });

  it('unwraps the links, the tables and the videos of a help page to their text', () => {
    expect(
      sanitizeRichTextHtml(
        `<p><a href="https://lolfi.justice.fr/">LOLFI</a></p><table><tbody><tr><td>Siège</td></tr></tbody></table><video src="https://storage.test/demo.mp4"></video>`,
      ),
    ).toBe('<p>LOLFI</p>Siège');
  });

  it('keeps the links, the tables and the separators of a help page as the editor writes them', () => {
    const written =
      `<h2 data-id="a1b2-c3">Profils</h2><p><a href="https://lolfi.justice.fr/">LOLFI</a>, <a href="mailto:csm@justice.fr">le CSM</a> et <a href="#a1b2-c3">plus haut</a></p>` +
      `<hr><table><tbody><tr><th colspan="2">Profil</th></tr><tr><td>Siège</td><td rowspan="1">Parquet</td></tr></tbody></table>` +
      `<aside data-kind="warning"><p>Attention</p></aside>`;

    expect(sanitizeRichPageHtml(written)).toBe(written);
  });

  it('keeps of a video its source on the web and its player, never a way to start it alone', () => {
    const written = `<video controls="" preload="metadata" src="https://storage.test/demo.mp4" data-file-id="file-2" data-file-name="demo.mp4"></video>`;

    expect(sanitizeRichPageHtml(written)).toBe(written);
    expect(
      sanitizeRichPageHtml(
        `<video autoplay="" loop="" muted="" preload="everything" src="javascript:alert(1)" onplay="alert(1)"></video>`,
      ),
    ).toBe('<video></video>');
  });

  it('keeps of a link only an address on the web or a section of the page', () => {
    expect(
      sanitizeRichPageHtml(
        `<a href="javascript:alert(1)">a</a><a href="tel:0102030405">t</a><a href="#top" target="_blank">b</a><h2 data-id="x y">c</h2><aside class="x" data-kind="danger">d</aside>`,
      ),
    ).toBe('<a>a</a><a>t</a><a href="#top">b</a><h2>c</h2><aside>d</aside>');
  });

  it('removes the comments', () => {
    expect(sanitizeRichTextHtml(`<p>Ada<!-- <script>alert(1)</script> --></p>`)).toBe('<p>Ada</p>');
  });
});

describe('fileIdsReferencedIn', () => {
  it('lists the files the text embeds, once each', () => {
    expect(
      fileIdsReferencedIn(
        '<p>Avis<img data-file-id="file-1" src="https://storage.test/a.png"></p><img data-file-id="file-2"><img data-file-id="file-1"><img src="x">',
      ),
    ).toEqual(new Set(['file-1', 'file-2']));
  });
});
