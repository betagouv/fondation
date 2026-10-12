import { contentDisposition } from './content-disposition';

describe('contentDisposition', () => {
  it('previews by default and downloads on demand', () => {
    expect(contentDisposition({ name: 'agenda.pdf' })).toBe('inline; filename="agenda.pdf"');
    expect(contentDisposition({ download: true, name: 'agenda.pdf' })).toBe(
      'attachment; filename="agenda.pdf"',
    );
  });

  it('keeps spaces readable instead of percent encoding them', () => {
    expect(contentDisposition({ name: 'Ordre du jour.pdf' })).toBe('inline; filename="Ordre du jour.pdf"');
  });

  it('carries a non ascii name in the encoded parameter', () => {
    expect(contentDisposition({ name: 'Procès-verbal.pdf' })).toBe(
      `inline; filename="Procès-verbal.pdf"; filename*=UTF-8''Proc%C3%A8s-verbal.pdf`,
    );
  });

  it('escapes what would close the quoted name', () => {
    expect(contentDisposition({ name: 'rapport "final".pdf' })).toBe(
      'inline; filename="rapport \\"final\\".pdf"',
    );
  });

  it('keeps the header within what node accepts above latin1', () => {
    expect(contentDisposition({ name: 'L’œuvre.pdf' })).toBe(
      `inline; filename="L??uvre.pdf"; filename*=UTF-8''L%E2%80%99%C5%93uvre.pdf`,
    );
  });

  it('encodes the quote that would close the extended name', () => {
    expect(contentDisposition({ name: `L'œuvre.pdf` })).toBe(
      `inline; filename="L'?uvre.pdf"; filename*=UTF-8''L%27%C5%93uvre.pdf`,
    );
  });
});
