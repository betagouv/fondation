import { sanitizeEditedHtml } from './edited-html';

describe('sanitizeEditedHtml', () => {
  it('keeps what the editor writes as it is', () => {
    const edited =
      `<h2>Avis</h2><p><strong>MME Ada LOVELACE</strong>, actuellement juge à la cour d'appel&nbsp;: ` +
      `<em>"dite de Paris"</em><br>au rapport de</p><ul><li>un</li></ul><ol><li>deux</li></ol><p></p>`;

    expect(sanitizeEditedHtml(edited)).toBe(edited);
  });

  it('removes the scripts and the styles with their content', () => {
    expect(sanitizeEditedHtml(`<p>Ada<script>alert(1)</script><style>p{}</style></p>`)).toBe('<p>Ada</p>');
  });

  it('removes every attribute', () => {
    expect(
      sanitizeEditedHtml(
        `<p onclick="alert(1)" style="color:red"><strong onmouseover="alert(1)">Ada</strong></p>`,
      ),
    ).toBe('<p><strong>Ada</strong></p>');
  });

  it('unwraps the tags the editor does not write, down to their text', () => {
    expect(
      sanitizeEditedHtml(`<p><img src=x onerror=alert(1)><a href="javascript:alert(1)">Ada</a></p>`),
    ).toBe('<p>Ada</p>');
    expect(sanitizeEditedHtml(`<svg><p>Ada</p></svg><math><mi>x</mi></math>`)).toBe('<p>Ada</p>x');
  });

  it('removes the comments', () => {
    expect(sanitizeEditedHtml(`<p>Ada<!-- <script>alert(1)</script> --></p>`)).toBe('<p>Ada</p>');
  });
});
