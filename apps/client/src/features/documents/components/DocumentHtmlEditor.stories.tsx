import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { presentationNoticeDocument } from './document.fixture';
import { DocumentHtmlEditor } from './DocumentHtmlEditor';

const meta = {
  args: {
    html: presentationNoticeDocument(),
    onHtmlChange: fn().mockName('onHtmlChange'),
    onPreview: fn().mockName('onPreview'),
    title: 'Notice de restitution',
  },
  component: DocumentHtmlEditor,
  parameters: { controls: { include: ['html', 'previewDisabledReason', 'title'] }, layout: 'padded' },
  // the editor reads its html once: the key starts it again when the control changes it
  render: (args) => <DocumentHtmlEditor key={args.html} {...args} />,
  title: 'Features/DocumentEditor/PresentationNotice',
} satisfies Meta<typeof DocumentHtmlEditor>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
