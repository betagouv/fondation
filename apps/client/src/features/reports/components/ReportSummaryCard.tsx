import type { ButtonProps } from '@codegouvfr/react-dsfr/Button';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import React from 'react';

import './ReportSummaryCard.css';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { useOpenSummaryAttachment } from '@/features/summary/hooks/useOpenSummaryAttachment';
import type { DetailedReportDto } from '@api/types';

import { Card } from './Card';

export function ReportSummaryCard(props: {
  nominationFileId: string;
  sessionId: string;
  summary: DetailedReportDto['summary'];
}) {
  const { open: openAttachment } = useOpenSummaryAttachment();
  const html = React.useMemo(() => convertTitleNodes(props.summary?.content ?? ''), [props.summary]);

  if (!html) return null;

  return (
    <Card id={reportHtmlIds.overview.summary}>
      <h2>Synthèse</h2>
      <article className="report__summary" dangerouslySetInnerHTML={{ __html: html }} />
      {(props.summary?.attachments.length ?? 0) > 0 ? (
        <ButtonsGroup
          buttons={
            (props.summary?.attachments ?? []).map(({ fileId, name, type }) => ({
              children: name,
              iconId:
                type === 'application/pdf'
                  ? 'ri-file-pdf-fill'
                  : type.startsWith('image/')
                    ? 'ri-file-image-fill'
                    : 'ri-file-fille',
              iconPosition: 'left',
              onClick: () =>
                openAttachment({
                  fileId,
                  name,
                  nominationFileId: props.nominationFileId,
                  sessionId: props.sessionId,
                }),
              priority: 'tertiary no outline',
            })) as unknown as [ButtonProps, ...ButtonProps[]]
          }
          inlineLayoutWhen="md and up"
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
