import '@codegouvfr/react-dsfr/main.css';
import '../src/styles/index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import addonMsw from 'msw-storybook-addon';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter, Route, Routes } from 'react-router';

import { frFormat } from '../src/i18n/formats';
import { sidePanelHandlers } from '../src/shared/storybook/msw.handlers';

startReactDsfr({ defaultColorScheme: 'light', Link });

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonMsw()],
  beforeEach: ({ msw }) => {
    msw.use(...sidePanelHandlers);
  },
  decorators: [
    (Story, context) => {
      const router = context.parameters.router as { initialEntries?: string[]; path?: string } | undefined;
      return (
        <MemoryRouter initialEntries={router?.initialEntries}>
          <NuqsAdapter>
            <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
              {router?.path ? (
                <Routes>
                  <Route element={<Story />} path={router.path} />
                </Routes>
              ) : (
                <Story />
              )}
            </IntlProvider>
          </NuqsAdapter>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Guide',
          'Design Tokens',
          'Session',
          [
            'Transparence',
            [
              'SgSessionFilesTable',
              'MemberSessionFilesTable',
              'SessionAttachmentsTable',
              'SessionDocumentsTable',
            ],
          ],
          'Features',
          [
            'Documents',
            ['DocumentEditor', ['Agenda', 'OfficialReport', 'PresentationNotice'], 'DocumentScreen'],
          ],
          'Shared',
        ],
      },
    },
  },
});
