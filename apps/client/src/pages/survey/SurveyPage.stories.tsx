import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { type Survey, surveyKeys } from '@queries/survey.queries';

import { SurveyPage } from './SurveyPage';

// NOT_EXPECTED stands for the API answering no survey at all
const STATUSES = ['NOT_ANSWERED', 'ANSWERED', 'PREVIEW', 'TEST', 'NOT_EXPECTED'] as const;
type Status = (typeof STATUSES)[number];

function SurveyPageStory(props: { questionnaire: Survey['questionnaire']; status: Status }) {
  const survey: Survey | null =
    props.status === 'NOT_EXPECTED'
      ? null
      : {
          last: props.status === 'ANSWERED' ? { answeredOn: { day: 1, month: 10, year: 2026 } } : null,
          // an admin always tests the secretariat's questionnaire
          questionnaire: props.status === 'TEST' ? 'SECRETARIAT' : props.questionnaire,
          status: props.status,
        };

  return (
    <PageStory
      key={`${props.status}-${props.questionnaire}`}
      location={ROUTE_PATHS.SURVEY}
      path={ROUTE_PATHS.SURVEY}
      seed={(client) => client.setQueryData(surveyKeys.mine, survey)}
      view={props.questionnaire === 'SECRETARIAT' ? 'sg' : 'member'}
    >
      <SurveyPage />
    </PageStory>
  );
}

const meta = {
  args: { questionnaire: 'MEMBER', status: 'NOT_ANSWERED' },
  argTypes: {
    questionnaire: { control: 'inline-radio', options: ['MEMBER', 'SECRETARIAT'] },
    status: { control: 'inline-radio', options: STATUSES },
  },
  beforeEach: ({ msw }) => {
    msw.use(http.post('*/api/surveys/v1/answer', () => new HttpResponse(null, { status: 204 })));
  },
  component: SurveyPageStory,
  parameters: {
    docs: {
      description: {
        component:
          "Questionnaire en étapes, une question par étape : 6 pour les membres, 5 pour le secrétariat général. Le formulaire est toujours vide, pour ne pas orienter la personne vers ses réponses précédentes. Une personne qui a déjà répondu (ANSWERED) voit la date de sa dernière réponse au-dessus du questionnaire. En production, un administrateur, y compris quand il usurpe un compte, ne fait que parcourir les deux questionnaires sans rien enregistrer (PREVIEW). En local et en recette (TEST), ses réponses sont enregistrées pour tester l'envoi et l'export Excel.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Pages/Survey',
} satisfies Meta<typeof SurveyPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
