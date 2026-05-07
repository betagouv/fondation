import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import React from 'react';

import './ReportSummaryCard.css';

import { reportHtmlIds } from '../../dom/html-ids';
import type { DetailedReportDto } from '@api/types';
import { useGenerateSummaryAttachmentPublicUrlMutation } from '@queries/summary.queries';

import { Card } from './Card';

export function ReportSummaryCard(props: {
  sessionId: string;
  nominationFileId: string;
  summary: DetailedReportDto['summary'];
}) {
  const { mutate } = useGenerateSummaryAttachmentPublicUrlMutation();
  const html = React.useMemo(() => convertTitleNodes(props.summary?.content ?? ''), [props.summary]);

  if (!html) return null;

  return (
    <Card id={reportHtmlIds.overview.summary}>
      <h2>Synthèse</h2>
      <article className="report__summary" dangerouslySetInnerHTML={{ __html: html }} />
      {(props.summary?.attachments.length ?? 0) > 0 ? (
        <ButtonsGroup
          inlineLayoutWhen="md and up"
          buttons={
            (props.summary?.attachments ?? []).map(({ fileId, name, type }) => ({
              onClick: () =>
                mutate({
                  fileId,
                  nominationFileId: props.nominationFileId,
                  sessionId: props.sessionId,
                }),
              priority: 'tertiary no outline',
              iconPosition: 'left',
              children: name,
              iconId:
                type === 'application/pdf'
                  ? 'ri-file-pdf-fill'
                  : type.startsWith('image/')
                    ? 'ri-file-image-fill'
                    : 'ri-file-fille',
            })) as unknown as [ButtonProps, ...ButtonProps[]]
          }
        />
      ) : null}
    </Card>
  );
}

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
