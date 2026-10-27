import { generateHTML, generateJSON } from '@tiptap/core';
import React from 'react';
import { useIntl } from 'react-intl';

import { lowerTitles, useTipTapExtensions } from '@/shared/ui/tip-tap-editor';
import { headingIdKey } from '@/shared/ui/tip-tap-editor/extensions/constant';

type Section = { id: string; level: number; text: string };

// a digit can compose an emoji too, so it is not a pictogram on its own: a "6.1" title keeps its 6
const LEADING_PICTOGRAMS = /^\s*(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Emoji_Modifier}]*)+\s*/u;

/** a pictogram pasted at the start of a title takes the size of the title: it is set apart to be scaled down */
function wrapLeadingPictogram($title: Element): void {
  // Notion pastes its titles in bold: the pictogram sits in the first text, however deep
  let $first: ChildNode | null = $title.firstChild;
  while ($first && $first.nodeType !== Node.TEXT_NODE) $first = $first.firstChild;
  if (!$first) return;

  const text = $first.textContent ?? '';
  const match = LEADING_PICTOGRAMS.exec(text);
  if (!match) return;

  const $pictogram = $title.ownerDocument.createElement('span');
  $pictogram.className = 'fondation-title-pictogram';
  $pictogram.textContent = match[0].trim();
  $first.textContent = text.slice(match[0].length);
  $first.parentNode?.insertBefore($pictogram, $first);
}

/** the titles become anchors and the links to other sites open apart from the page */
function withNavigation(html: string): { html: string; sections: Section[] } {
  const { body } = new DOMParser().parseFromString(html, 'text/html');
  const sections: Section[] = [];

  for (const $title of body.querySelectorAll('h2, h3, h4')) {
    const id = $title.getAttribute(headingIdKey);
    const text = $title.textContent.trim();
    if (!id || !text) continue;

    $title.id = id;
    wrapLeadingPictogram($title);
    sections.push({ id, level: Number($title.tagName.at(1)), text });
  }

  for (const $link of body.querySelectorAll('a[href]')) {
    if ($link.getAttribute('href')?.startsWith('#')) continue;

    $link.setAttribute('rel', 'noopener noreferrer');
    $link.setAttribute('target', '_blank');
  }

  return { html: body.innerHTML, sections };
}

export function HelpPageContent(props: { content: string }) {
  const extensions = useTipTapExtensions({ features: 'page' });
  const { formatMessage } = useIntl();
  const { html, sections } = React.useMemo(
    () =>
      withNavigation(
        lowerTitles(generateHTML(generateJSON(props.content, extensions), extensions), { by: 1 }),
      ),
    [extensions, props.content],
  );
  const topLevel = Math.min(...sections.map(({ level }) => level));

  return (
    <div className="flex items-start gap-8">
      {sections.length > 0 && (
        <nav
          aria-label={formatMessage({ defaultMessage: 'Sommaire de la page' })}
          className="fr-sidemenu sticky top-(--fondation-table-header-top) max-h-[calc(100vh-var(--fondation-table-header-top))] w-80 shrink-0 [scrollbar-width:none] overflow-y-auto"
        >
          <div className="fr-sidemenu__inner">
            <ul className="fr-sidemenu__list">
              {sections.map((section) => (
                <li className="fr-sidemenu__item" key={section.id}>
                  <a
                    className={
                      section.level === topLevel ? 'fr-sidemenu__link' : 'fr-sidemenu__link fr-pl-6v'
                    }
                    href={`#${section.id}`}
                  >
                    {section.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
      {/* the round trip through the editor schema drops whatever the editor cannot produce, scripts included */}
      <article
        className="fondation-rich-text fondation-help-article max-w-4xl min-w-0 flex-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
