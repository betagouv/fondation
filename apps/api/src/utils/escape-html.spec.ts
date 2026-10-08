import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it.each`
    input                          | expected
    ${'Transparence "T1" (12)'}    | ${'Transparence &quot;T1&quot; (12)'}
    ${'<script>alert(1)</script>'} | ${'&lt;script&gt;alert(1)&lt;/script&gt;'}
    ${"l'import & co"}             | ${'l&#39;import &amp; co'}
    ${'rien à échapper'}           | ${'rien à échapper'}
  `('should escape "$input" into "$expected"', ({ input, expected }) => {
    expect(escapeHtml(input)).toBe(expected);
  });
});
