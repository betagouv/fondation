import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { AppFooter } from './AppFooter';

const LOCATIONS = { app: ROUTE_PATHS.TRANSPARENCES.DASHBOARD, login: ROUTE_PATHS.LOGIN } as const;
type Page = keyof typeof LOCATIONS;

function AppFooterStory(props: { page: Page }) {
  return (
    <Routes location={LOCATIONS[props.page]}>
      <Route element={<AppFooter />} path="*" />
    </Routes>
  );
}

const meta = {
  args: { page: 'app' },
  argTypes: { page: { control: 'inline-radio', options: Object.keys(LOCATIONS) } },
  component: AppFooterStory,
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
} satisfies Meta<typeof AppFooterStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
