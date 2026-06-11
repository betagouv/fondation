import '../src/index.css';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import type { Preview } from '@storybook/react-vite';
import { IntlProvider } from 'react-intl';
import { Link, MemoryRouter } from 'react-router';

import { frFormat } from '../src/i18n/formats';

startReactDsfr({ defaultColorScheme: 'light', Link });

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <IntlProvider formats={frFormat} locale="fr" defaultLocale="fr">
          <Story />
        </IntlProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
};

export default preview;
