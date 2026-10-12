import type { Meta, StoryObj } from '@storybook/react-vite';

import { authHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';

import { FeedbackHeaderButton } from './FeedbackHeaderButton';

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(...authHandlers);
  },
  component: FeedbackHeaderButton,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        {/* the header restyles its buttons: without its markup, this one would not look as it does in the app */}
        <div className="fr-header filter-none!">
          <div className="fr-header__tools-links justify-start!">
            <ul className="fr-btns-group justify-start!">
              <li>
                <Story />
              </li>
            </ul>
          </div>
        </div>
      </StoryQueryClient>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Bouton \"Donner mon avis\" dans l'en-tête, entre le centre d'aide et le compte. Il mène toujours à la page d'avis : un administrateur y trouve l'aperçu du questionnaire.",
      },
    },
  },
  tags: ['autodocs'],
  title: 'Features/Feedback/HeaderButton',
} satisfies Meta<typeof FeedbackHeaderButton>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
