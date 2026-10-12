import { generateHTML, generateJSON } from '@tiptap/core';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { DetailsCard } from '@/shared/ui/details';
import { useTipTapExtensions } from '@/shared/ui/tip-tap-editor';

import { SummaryEditor } from './SummaryEditor';

export function SummaryContentCard() {
  const { canWriteSummary, summary } = useSummary();

  return (
    <DetailsCard>
      <h2 className="fr-h6" id="synthese-title">
        <FormattedMessage defaultMessage="Synthèse" />
      </h2>

      <div
        className={clsx(
          canWriteSummary ? '-mt-8 [&_.ProseMirror]:min-h-60' : 'fr-p-4v bg-(--background-alt-grey)',
        )}
      >
        {canWriteSummary && !summary.isArchived ? (
          <SummaryEditor />
        ) : (
          <SummaryContent content={summary.summary.content} />
        )}
      </div>
    </DetailsCard>
  );
}

function SummaryContent(props: { content: string }) {
  const extensions = useTipTapExtensions();
  const html = React.useMemo(
    () => lowerTitles(generateHTML(generateJSON(props.content, extensions), extensions)),
    [extensions, props.content],
  );

  // the round trip through the editor schema drops whatever the editor cannot produce, scripts included
  return <article className="[&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** the summary titles start at h1, which would break the page hierarchy under its h2 */
function lowerTitles(html: string): string {
  const { body } = new DOMParser().parseFromString(html, 'text/html');

  for (const $title of body.querySelectorAll('h1, h2, h3')) {
    const $tag = body.ownerDocument.createElement('h' + (Number($title.tagName.at(1)) + 2));

    for (const attr of $title.attributes) $tag.setAttribute(attr.name, attr.value);
    while ($title.firstChild) $tag.appendChild($title.firstChild);

    $title.replaceWith($tag);
  }

  return body.innerHTML;
}
