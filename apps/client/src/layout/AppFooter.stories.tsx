import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppFooter } from './AppFooter';

const meta = {
  component: AppFooter,
  parameters: {
    docs: {
      description: {
        component:
          "Pied de page. Complet sur la page de connexion, avec la description de l'outil. Réduit dans l'application, à la licence, à l'accessibilité et au numéro de version.",
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Layout/Footer',
} satisfies Meta<typeof AppFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InTheApp: Story = { parameters: { router: { initialEntries: ['/transparences'] } } };

export const OnLogin: Story = { parameters: { router: { initialEntries: ['/login'] } } };
