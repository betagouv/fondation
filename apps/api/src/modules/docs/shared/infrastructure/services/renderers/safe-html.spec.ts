import { html, indentedHtml, SafeHtml } from './safe-html';

describe('html', () => {
  it('escapes an inserted text, so a document reads it rather than runs it', () => {
    expect(String(html`<p>${`<img src=x onerror="alert('x')"> & co`}</p>`)).toBe(
      '<p>&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; co</p>',
    );
  });

  it('inserts a fragment already in HTML as is, so a nested template is escaped once', () => {
    expect(String(html`<p>${html`<strong>${'Barré & Sinoussi'}</strong>`}</p>`)).toBe(
      '<p><strong>Barré &amp; Sinoussi</strong></p>',
    );
  });

  it('escapes each item of a list', () => {
    expect(String(indentedHtml`<ul>${['<b>', html`<li>kept</li>`]}</ul>`)).toBe(
      '<ul>&lt;b&gt; <li>kept</li></ul>',
    );
  });

  it('prints nothing for a missing value', () => {
    expect(String(html`<p>${null}${undefined}</p>`)).toBe('<p></p>');
  });
});

describe('SafeHtml.join', () => {
  it('keeps the fragments it joins as they are', () => {
    expect(String(SafeHtml.join([html`<li>${'<a>'}</li>`, html`<li>b</li>`], '\n'))).toBe(
      '<li>&lt;a&gt;</li>\n<li>b</li>',
    );
  });
});
