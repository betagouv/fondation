import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import clsx from 'clsx';
import { useCallback, useRef } from 'react';
import { fn } from 'storybook/test';

import { presentationNoticeDocument } from './document.fixture';
import { DocumentHtmlEditor } from './DocumentHtmlEditor';
import { DocumentScreen } from './DocumentScreen';
import { DocumentViewer, type DocumentViewerHandle } from './DocumentViewer';

const NOTICE = presentationNoticeDocument();

const meta = {
  args: {
    html: presentationNoticeDocument({ paged: false }),
    onHtmlChange: fn().mockName('onHtmlChange'),
    title: 'Notice de restitution',
  },
  component: DocumentHtmlEditor,
  parameters: { controls: { include: ['title'] }, layout: 'padded' },
  title: 'Features/Documents/DocumentEditor/PresentationNotice',
} satisfies Meta<typeof DocumentHtmlEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function NoticeWorkspace() {
  const viewerRef = useRef<DocumentViewerHandle>(null);
  const onHtmlChange = useCallback((next: string) => viewerRef.current?.updateContent(next), []);

  return (
    <DocumentScreen
      actions={
        <>
          <Button priority="secondary">Annuler</Button>
          <Button iconId="fr-icon-success-fill" iconPosition="right">
            Sauvegarder
          </Button>
        </>
      }
      title="Notice de restitution"
      tone="alt"
    >
      <div className="flex min-w-0 flex-1 flex-col xl:flex-2">
        <DocumentHtmlEditor html={NOTICE} title="Notice de restitution" onHtmlChange={onHtmlChange} />
      </div>
      <DocumentViewer
        ref={viewerRef}
        className={clsx('border-0', 'hidden md:block md:flex-1 xl:flex-3')}
        html={NOTICE}
        title="Notice de restitution"
      />
    </DocumentScreen>
  );
}

/** the two panes of the edit mode: type on the left, the rendered document follows on the right */
export const InScreen: Story = { render: () => <NoticeWorkspace /> };
