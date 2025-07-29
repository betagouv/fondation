import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { type FC } from 'react';
import { ImportObservantsModal } from './ImportObservantsModal';
import { parseTransparenceCompositeId } from '../../../models/transparence.model';
import { useGetTransparence } from '../../../queries/sg/get-transparence.query';
import { DateOnly } from '../../../models/date-only.model';
import { useParams } from 'react-router-dom';
import { ImportAttachmentModal } from './ImportAttachmentModal';

export const Transparence: FC = () => {
  const { id } = useParams();
  const args = parseTransparenceCompositeId(id!);
  const {
    name,
    formation,
    date: { year, month, day }
  } = args;

  const {
    data: transparence,
    isPending,
    isError
  } = useGetTransparence({
    nom: name,
    formation,
    year,
    month,
    day
  });

  if (isPending) {
    return null;
  }

  if (!args || !transparence || isError) {
    return <div>Session de type Transparence non trouvée.</div>;
  }

  return (
    <div className={clsx(cx('fr-container'))}>
      <div className={clsx('gap-4', cx('fr-grid-row', 'fr-py-8v'))}>
        <div
          className={clsx(
            'mt-4 flex flex-col justify-start gap-y-6',
            cx('fr-col-3', 'fr-text--bold')
          )}
        >
          <div>TABLEAU DE BORD</div>

          <ImportObservantsModal
            nomTransparence={transparence.name}
            formation={args.formation}
            dateTransparence={
              new DateOnly(args.date.year, args.date.month, args.date.day)
            }
          />
          <ImportAttachmentModal
            transparenceId={transparence.id}
            transparenceName={transparence.name}
            transparenceFormation={transparence.formation}
            transparenceDate={new DateOnly(year, month, day)}
          />
        </div>

        <div
          className={clsx(
            'border-2 border-solid',
            cx('fr-px-12v', 'fr-py-8v', 'fr-col')
          )}
        >
          <h1>Gérer une session</h1>

          <div
            className={clsx(
              'grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4'
            )}
          >
            <Label nom="Type de session" />
            <div>Transparence</div>

            <Label nom="Nom de la session" />
            <div>{transparence.name}</div>

            <Label nom="Formation" />
            <div>{transparence.formation}</div>

            <Label nom="Date de la session" />
            <div>
              {new DateOnly(
                transparence['content'].dateTransparence.year,
                transparence['content'].dateTransparence.month,
                transparence['content'].dateTransparence.day
              ).toFormattedString('dd/MM/yyyy')}
            </div>

            <Label nom="Clôture du délai d'observation" />
            <div>
              {new DateOnly(
                transparence['content'].dateClôtureDélaiObservation.year,
                transparence['content'].dateClôtureDélaiObservation.month,
                transparence['content'].dateClôtureDélaiObservation.day
              ).toFormattedString('dd/MM/yyyy')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

export default Transparence;
