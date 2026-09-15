import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ReportDetailsHeader } from './ReportDetailsHeader';

const meta = {
  title: 'Features/ReportDetails/Header',
  component: ReportDetailsHeader,
  parameters: { controls: { include: ['isReadOnly', 'state'] }, layout: 'padded' },
  tags: ['autodocs'],
  args: {
    detectedMagistrat: { firstName: 'Maurice', lastName: 'Ravel', usedName: null },
    detectedMagistratId: 'magistrat-1',
    isReadOnly: false,
    name: 'RAVEL MAURICE',
    nominationFileId: 'dossier-1',
    onUpdateState: fn().mockName('onUpdateState'),
    priorities: ['ETOILE'],
    sessionId: 'session-1',
    state: 'IN_PROGRESS',
  },
} satisfies Meta<typeof ReportDetailsHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithoutDetectedMagistrat: Story = {
  args: { detectedMagistrat: null, detectedMagistratId: null },
};

export const ArchivedSession: Story = {
  args: { isReadOnly: true, state: 'SUPPORTED' },
};
