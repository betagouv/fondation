import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { AlertBanner, AlertBannerAction } from './AlertBanner';

const LAYOUT = 'rounded px-4 py-3';

const TONES = ['error', 'warning', 'info', 'neutral'] as const;

function AlertBannerStory({
  buttonAction,
  ...props
}: ComponentProps<typeof AlertBanner> & { buttonAction: boolean }) {
  return (
    <AlertBanner {...props}>
      {buttonAction && <AlertBannerAction onClick={() => {}}>Modifier</AlertBannerAction>}
    </AlertBanner>
  );
}

const meta = {
  title: 'Shared/AlertBanner',
  component: AlertBannerStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'center'] },
    buttonAction: { control: 'boolean' },
    children: { table: { disable: true } },
    className: { table: { disable: true } },
    icon: { control: 'text' },
    message: { control: 'text' },
    tone: { control: 'inline-radio', options: TONES },
  },
  args: {
    align: 'center',
    buttonAction: true,
    className: LAYOUT,
    icon: 'fr-icon-warning-fill',
    message: 'Une alerte sur ce dossier',
    tone: 'warning',
  },
} satisfies Meta<typeof AlertBannerStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
