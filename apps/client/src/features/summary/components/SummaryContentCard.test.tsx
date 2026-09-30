import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { makeSummary } from '@/shared/storybook/summary.fixtures';

import { SummaryContentCard } from './SummaryContentCard';

function renderReadOnly(content: string) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SummaryContext
        value={{
          canWriteSummary: false,
          nominationFileId: 'nomination-file-1',
          sessionId: 'session-1',
          summary: makeSummary({ summary: { content } }),
        }}
      >
        <SummaryContentCard />
      </SummaryContext>
    </IntlProvider>,
  );
}

describe('SummaryContentCard', () => {
  it('drops what the editor cannot produce before showing the summary to its readers', () => {
    const { container } = renderReadOnly(
      '<p onclick="alert(1)">Avis</p><img src="https://example.org/a.png" onerror="alert(2)"><script>alert(3)</script>',
    );
    const article = container.querySelector('article')!;

    expect(article.textContent).toBe('Avis');
    expect(article.querySelector('script')).toBeNull();
    expect(article.innerHTML).not.toMatch(/onclick|onerror/);
    expect(article.querySelector('img')?.getAttribute('src')).toBe('https://example.org/a.png');
  });

  it('lowers the summary titles under the card title', () => {
    const { container } = renderReadOnly('<h1>Parcours</h1><h3>Détail</h3>');

    expect(container.querySelector('article h3')?.textContent).toBe('Parcours');
    expect(container.querySelector('article h5')?.textContent).toBe('Détail');
  });
});
