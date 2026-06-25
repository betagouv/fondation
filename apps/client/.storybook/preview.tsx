import '@codegouvfr/react-dsfr/main.css';
import '../src/styles/index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import type { Preview } from '@storybook/react-vite';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router';

import { frFormat } from '../src/i18n/formats';

startReactDsfr({ defaultColorScheme: 'light', Link });

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const router = context.parameters.router as { initialEntries?: string[]; path?: string } | undefined;
      return (
        <MemoryRouter initialEntries={router?.initialEntries}>
          <IntlProvider formats={frFormat} locale="fr" defaultLocale="fr">
            {router?.path ? (
              <Routes>
                <Route element={<Story />} path={router.path} />
              </Routes>
            ) : (
              <Story />
            )}
          </IntlProvider>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
