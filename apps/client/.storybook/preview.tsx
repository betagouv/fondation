import '@codegouvfr/react-dsfr/main.css';
import '../src/styles/index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import addonMsw from 'msw-storybook-addon';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { createContext, use, useMemo, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';

import { frFormat } from '../src/i18n/formats';
import { sidePanelHandlers } from '../src/shared/storybook/msw.handlers';

startReactDsfr({ defaultColorScheme: 'light', Link });

const CurrentStory = createContext<ReactNode>(null);

function CurrentStoryOutlet() {
  return use(CurrentStory);
}

// a data router, as in the app, for useBlocker. Built once per story: the story comes through a
// context, otherwise the router would keep the first render and ignore a change of args
function StoryRouter(props: { children: ReactNode; initialEntries?: string[]; path?: string }) {
  const { initialEntries, path } = props;
  const router = useMemo(
    () => createMemoryRouter([{ element: <CurrentStoryOutlet />, path: path ?? '*' }], { initialEntries }),
    [initialEntries, path],
  );

  return (
    <CurrentStory value={props.children}>
      <RouterProvider router={router} />
    </CurrentStory>
  );
}

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonMsw()],
  beforeEach: ({ msw }) => {
    msw.use(...sidePanelHandlers);
  },
  decorators: [
    (Story, context) => {
      const router = context.parameters.router as { initialEntries?: string[]; path?: string } | undefined;
      return (
        <StoryRouter initialEntries={router?.initialEntries} path={router?.path}>
          <NuqsAdapter>
            <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
              <Story />
            </IntlProvider>
          </NuqsAdapter>
        </StoryRouter>
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
              'SessionDocumentsTable',
              'AgendaFilesSelectionTable',
              'SessionAttachmentsTable',
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
