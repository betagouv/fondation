import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { HelpPageContent } from './HelpPageContent';

function renderContent(content: string) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <HelpPageContent content={content} />
    </IntlProvider>,
  );
}

describe('HelpPageContent', () => {
  it('lists the titles in a side menu that leads to them', () => {
    const { container } = renderContent(
      '<h1 data-id="intro">Introduction</h1><p>Texte</p><h2 data-id="profils">Profils</h2>',
    );

    const links = [...container.querySelectorAll('nav a')].map(($a) => [
      $a.getAttribute('href'),
      $a.textContent,
    ]);
    expect(links).toEqual([
      ['#intro', 'Introduction'],
      ['#profils', 'Profils'],
    ]);
    expect(container.querySelector('article h2#intro')?.textContent).toBe('Introduction');
    expect(container.querySelector('article h3#profils')?.textContent).toBe('Profils');
  });

  it('sets the pictogram pasted at the start of a title apart, to scale it down', () => {
    const { container } = renderContent('<h1 data-id="intro"><strong>🎯 1. Introduction</strong></h1>');
    const $title = container.querySelector('article h2')!;

    expect($title.querySelector('.fondation-title-pictogram')?.textContent).toBe('🎯');
    expect($title.textContent).toBe('🎯1. Introduction');

    const numbered = renderContent('<h1 data-id="annexes">6.1 Statuts</h1>');
    expect(numbered.container.querySelector('.fondation-title-pictogram')).toBeNull();
  });

  it('keeps the links, the tables and the separators, and opens the other sites apart', () => {
    const { container } = renderContent(
      '<p><a href="https://lolfi.justice.fr/">LOLFI</a> <a href="#intro">haut</a></p><hr>' +
        '<table><tbody><tr><th>Profil</th></tr><tr><td>Siège</td></tr></tbody></table>' +
        '<aside><p>À savoir</p></aside>',
    );
    const article = container.querySelector('article')!;

    expect(article.querySelector('a[href="https://lolfi.justice.fr/"]')?.getAttribute('target')).toBe(
      '_blank',
    );
    expect(article.querySelector('a[href="#intro"]')?.getAttribute('target')).toBeNull();
    expect(article.querySelector('hr')).not.toBeNull();
    expect(article.querySelector('table th')?.textContent).toBe('Profil');
    expect(article.querySelector('table td')?.textContent).toBe('Siège');
    expect(article.querySelector('aside.fr-callout p')?.textContent).toBe('À savoir');
  });

  it('drops what the editor cannot produce', () => {
    const { container } = renderContent(
      '<p onclick="alert(1)">Aide</p><a href="javascript:alert(2)">x</a><script>alert(3)</script>',
    );
    const article = container.querySelector('article')!;

    expect(article.querySelector('script')).toBeNull();
    expect(article.innerHTML).not.toMatch(/onclick|javascript:/);
  });
});
