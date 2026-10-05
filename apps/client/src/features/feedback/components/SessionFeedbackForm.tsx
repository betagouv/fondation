import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import { useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useLeaveFeedbackGuard } from '@/features/feedback/hooks/useLeaveFeedbackGuard';
import type { AnswerSessionFeedbackDto } from '@api/types';
import type { SessionFeedback } from '@queries/feedback.queries';

type MemberAnswers = NonNullable<AnswerSessionFeedbackDto['member']>;
type SecretariatAnswers = NonNullable<AnswerSessionFeedbackDto['secretariat']>;
type Answers = Partial<Record<string, string>>;
type Step = { name: string; question: ReactNode; title: ReactNode };

function Choices(props: {
  answers: Answers;
  legend: ReactNode;
  name: string;
  onChange?: (value: string) => void;
  options: readonly { label: ReactNode; value: string }[];
  orientation?: 'horizontal';
}) {
  return (
    <RadioButtons
      legend={props.legend}
      name={props.name}
      options={props.options.map(({ label, value }) => ({
        label,
        nativeInputProps: {
          defaultChecked: props.answers[props.name] === value,
          onChange: () => props.onChange?.(value),
          required: true,
          value,
        },
      }))}
      orientation={props.orientation}
    />
  );
}

function Rating(props: { answers: Answers; legend: ReactNode; max: number; name: string }) {
  const values = Array.from({ length: props.max }, (_, index) => String(index + 1));
  return (
    <Choices
      answers={props.answers}
      legend={props.legend}
      name={props.name}
      options={values.map((value) => ({ label: value, value }))}
      orientation="horizontal"
    />
  );
}

function FreeText(props: { answers: Answers; label: ReactNode; name: string }) {
  return (
    <Input
      hintText={<FormattedMessage defaultMessage="Facultatif. Ne mentionnez aucun nom ni aucun dossier." />}
      label={props.label}
      nativeTextAreaProps={{
        defaultValue: props.answers[props.name],
        maxLength: 2_000,
        name: props.name,
        rows: 5,
      }}
      textArea
    />
  );
}

function OtherTools(props: { answers: Answers }) {
  const { formatMessage } = useIntl();
  const [usage, setUsage] = useState(props.answers.otherToolUsage);

  return (
    <>
      <Choices
        answers={props.answers}
        legend={
          <FormattedMessage defaultMessage="Lors de cette session, avez-vous dû utiliser un autre outil que Fondation (tableur, messagerie, document Word, application interne…) pour faire une partie de votre travail ?" />
        }
        name="otherToolUsage"
        onChange={setUsage}
        options={[
          { label: formatMessage({ defaultMessage: "Non, tout s'est fait dans Fondation" }), value: 'NONE' },
          { label: formatMessage({ defaultMessage: 'Oui, ponctuellement' }), value: 'OCCASIONALLY' },
          {
            label: formatMessage({ defaultMessage: 'Oui, pour une partie importante du travail' }),
            value: 'SIGNIFICANTLY',
          },
        ]}
      />
      {usage && usage !== 'NONE' && (
        <FreeText
          answers={props.answers}
          label={<FormattedMessage defaultMessage="Si oui, pour quoi faire ?" />}
          name="otherToolPurpose"
        />
      )}
    </>
  );
}

function textOf(answers: Answers, name: string): string | null {
  return answers[name]?.trim() || null;
}

function answersOf(
  answers: Answers,
  questionnaire: SessionFeedback['questionnaire'],
): AnswerSessionFeedbackDto {
  return {
    easeRating: Number(answers.easeRating),
    hindrance: textOf(answers, 'hindrance'),
    member:
      questionnaire === 'MEMBER'
        ? {
            debateContribution: answers.debateContribution as MemberAnswers['debateContribution'],
            manualWorkShare: answers.manualWorkShare as MemberAnswers['manualWorkShare'],
            reviewThoroughness: answers.reviewThoroughness as MemberAnswers['reviewThoroughness'],
          }
        : null,
    satisfactionRating: Number(answers.satisfactionRating),
    secretariat:
      questionnaire === 'SECRETARIAT'
        ? {
            manualWorkShare: answers.manualWorkShare as SecretariatAnswers['manualWorkShare'],
            otherToolPurpose: answers.otherToolUsage === 'NONE' ? null : textOf(answers, 'otherToolPurpose'),
            otherToolUsage: answers.otherToolUsage as SecretariatAnswers['otherToolUsage'],
          }
        : null,
  };
}

function useSteps(questionnaire: SessionFeedback['questionnaire'], answers: Answers): Step[] {
  const { formatMessage } = useIntl();

  const manualWorkShares: { label: string; value: MemberAnswers['manualWorkShare'] }[] = [
    { label: formatMessage({ defaultMessage: 'Moins de 10 %' }), value: 'LESS_THAN_10' },
    { label: formatMessage({ defaultMessage: '10 à 25 %' }), value: 'FROM_10_TO_25' },
    { label: formatMessage({ defaultMessage: '25 à 40 %' }), value: 'FROM_25_TO_40' },
    { label: formatMessage({ defaultMessage: '40 à 60 %' }), value: 'FROM_40_TO_60' },
    { label: formatMessage({ defaultMessage: 'Plus de 60 %' }), value: 'MORE_THAN_60' },
  ];

  const common: Step[] = [
    {
      name: 'easeRating',
      question: (
        <Rating
          answers={answers}
          legend={
            <FormattedMessage defaultMessage="Sur une note de 1 à 5, le produit Fondation est-il facile à utiliser ?" />
          }
          max={5}
          name="easeRating"
        />
      ),
      title: <FormattedMessage defaultMessage="Facilité d'utilisation" />,
    },
    {
      name: 'satisfactionRating',
      question: (
        <Rating
          answers={answers}
          legend={
            <FormattedMessage defaultMessage="Sur une note de 1 à 10, quelle est votre satisfaction globale sur Fondation ?" />
          }
          max={10}
          name="satisfactionRating"
        />
      ),
      title: <FormattedMessage defaultMessage="Satisfaction globale" />,
    },
  ];

  const hindrance: Step = {
    name: 'hindrance',
    question: (
      <FreeText
        answers={answers}
        label={
          <FormattedMessage defaultMessage="Qu'est-ce qui vous a le plus ralenti ou gêné lors de cette session ?" />
        }
        name="hindrance"
      />
    ),
    title: <FormattedMessage defaultMessage="Ce qui vous a gêné" />,
  };

  if (questionnaire === 'MEMBER') {
    return [
      ...common,
      {
        name: 'manualWorkShare',
        question: (
          <Choices
            answers={answers}
            legend={
              <FormattedMessage defaultMessage="Lors de cette session, quelle part de votre temps avez-vous passée sur des tâches de manipulation (rechercher une information, la recopier, mettre en forme un document) plutôt que sur l'analyse des dossiers ?" />
            }
            name="manualWorkShare"
            options={manualWorkShares}
          />
        ),
        title: <FormattedMessage defaultMessage="Temps de manipulation" />,
      },
      {
        name: 'debateContribution',
        question: (
          <Choices
            answers={answers}
            legend={
              <FormattedMessage defaultMessage="Lors de cette session, avez-vous pu contribuer au débat sur des dossiers dont vous n'étiez pas rapporteur ?" />
            }
            name="debateContribution"
            options={[
              { label: formatMessage({ defaultMessage: 'Jamais' }), value: 'NEVER' },
              { label: formatMessage({ defaultMessage: 'Au moins une fois' }), value: 'AT_LEAST_ONCE' },
            ]}
          />
        ),
        title: <FormattedMessage defaultMessage="Contribution au débat" />,
      },
      {
        name: 'reviewThoroughness',
        question: (
          <Choices
            answers={answers}
            legend={
              <FormattedMessage defaultMessage="Avez-vous pu instruire l'ensemble des dossiers de la session avec le même niveau d'exigence ?" />
            }
            name="reviewThoroughness"
            options={[
              { label: formatMessage({ defaultMessage: 'Oui' }), value: 'YES' },
              { label: formatMessage({ defaultMessage: 'Partiellement' }), value: 'PARTIALLY' },
              { label: formatMessage({ defaultMessage: 'Non, faute de temps' }), value: 'NO_LACK_OF_TIME' },
              {
                label: formatMessage({ defaultMessage: "Non, faute d'accès à l'information" }),
                value: 'NO_LACK_OF_INFORMATION',
              },
            ]}
          />
        ),
        title: <FormattedMessage defaultMessage="Instruction des dossiers" />,
      },
      hindrance,
    ];
  }

  return [
    ...common,
    {
      name: 'manualWorkShare',
      question: (
        <Choices
          answers={answers}
          legend={
            <FormattedMessage defaultMessage="Lors de cette session, quelle part de votre temps avez-vous passée à ressaisir, recopier ou remettre en forme à la main des informations déjà disponibles ailleurs ?" />
          }
          name="manualWorkShare"
          options={manualWorkShares}
        />
      ),
      title: <FormattedMessage defaultMessage="Temps de ressaisie" />,
    },
    {
      name: 'otherToolUsage',
      question: <OtherTools answers={answers} />,
      title: <FormattedMessage defaultMessage="Autres outils" />,
    },
    hindrance,
  ];
}

export function SessionFeedbackForm(props: {
  isPreview?: boolean;
  isSubmitting: boolean;
  onSubmit: (answers: AnswerSessionFeedbackDto) => void;
  questionnaire: SessionFeedback['questionnaire'];
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [isStarted, setStarted] = useState(false);
  useLeaveFeedbackGuard(isStarted && !props.isSubmitting && !props.isPreview);
  const steps = useSteps(props.questionnaire, answers);
  const step = steps[stepIndex]!;
  const isLast = stepIndex === steps.length - 1;
  const remember = (form: HTMLFormElement): Answers => {
    const next = {
      ...answers,
      ...Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, String(value)])),
    };
    setAnswers(next);
    return next;
  };

  return (
    <>
      <Stepper
        className="fr-mb-10v"
        currentStep={stepIndex + 1}
        nextTitle={steps[stepIndex + 1]?.title}
        stepCount={steps.length}
        title={step.title}
      />
      <form
        key={step.name}
        onChange={() => setStarted(true)}
        onSubmit={(event) => {
          event.preventDefault();
          const next = remember(event.currentTarget);
          if (isLast) props.onSubmit(answersOf(next, props.questionnaire));
          else setStepIndex(stepIndex + 1);
        }}
      >
        {step.question}
        <div className="fr-mt-10v flex flex-wrap justify-end gap-4">
          {stepIndex > 0 && (
            <Button
              disabled={props.isSubmitting}
              iconId="fr-icon-arrow-left-line"
              onClick={(event) => {
                if (event.currentTarget.form) remember(event.currentTarget.form);
                setStepIndex(stepIndex - 1);
              }}
              priority="secondary"
              type="button"
            >
              <FormattedMessage defaultMessage="Étape précédente" />
            </Button>
          )}
          <Button
            disabled={props.isSubmitting}
            iconId={isLast ? 'fr-icon-send-plane-line' : 'fr-icon-arrow-right-line'}
            iconPosition="right"
            type="submit"
          >
            {isLast ? (
              <FormattedMessage defaultMessage="Envoyer mon avis" />
            ) : (
              <FormattedMessage defaultMessage="Étape suivante" />
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
