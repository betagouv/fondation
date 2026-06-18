import clsx from 'clsx';
import React from 'react';

import './SummarySectionContent.css';

import { useSummary } from '@/pages/summary/SummaryContext';

import { SummarySectionCard } from './SummarySectionCard';
import { SummaryEditor } from './SummarySectionEditor';

export function SummarySectionContent() {
  const { summary, canWriteSummary } = useSummary();

  return (
    <SummarySectionCard id="synthese" disablePadding>
      <h2 className="fr-px-6v fr-pt-4v">Synthèse</h2>

      <div
        className={clsx(
          'fr-px-6v fr-pb-6v rounded-b-lg',
          !canWriteSummary && 'fr-pt-4v bg-(--background-alt-grey)',
        )}
      >
        {canWriteSummary && !summary.isArchived ? (
          <SummaryEditor />
        ) : (
          <SummaryContent content={summary.summary.content} />
        )}
      </div>
    </SummarySectionCard>
  );
}

function SummaryContent(props: { content: string }) {
  const html = React.useMemo(() => convertTitleNodes(props.content), [props.content]);

  // FIXME: sanitize content
  return <article id="summary_content" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Users are able to use h1, h2, h3 inside the summary content.
 * It will break the document hierarchy when reading.
 * To prevent this, we replace each h<level>
 * with h<level + 2>.
 */
function convertTitleNodes(html: string): string {
  const $html = document.createElement('article');
  $html.innerHTML = html;

  for (const $title of $html.querySelectorAll('h1, h2, h3')) {
    const $tag = document.createElement('h' + (Number($title.tagName.at(1)) + 2));

    for (const attr of $title.attributes) $tag.setAttribute(attr.name, attr.value);
    while ($title.firstChild) $tag.appendChild($title.firstChild);

    $title.replaceWith($tag);
  }

  return $html.innerHTML;
}
