import { sanitizeRichTextHtml } from './rich-text-html';

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
    expect(
      sanitizeRichTextHtml(`<p><a href="javascript:alert(1)">Ada</a></p><constructor>x</constructor>`),
    ).toBe('<p>Ada</p>x');
    expect(sanitizeRichTextHtml(`<svg><p>Ada</p></svg><math><mi>x</mi></math>`)).toBe('<p>Ada</p>x');
  });

  it('removes the comments', () => {
    expect(sanitizeRichTextHtml(`<p>Ada<!-- <script>alert(1)</script> --></p>`)).toBe('<p>Ada</p>');
  });
});
