import { colors } from '@codegouvfr/react-dsfr';
import { FormattedMessage } from 'react-intl';

import { dateOnlyToDate } from '@/utils/date-only.util';
import type { DetailedNominationSessionDto } from '@api/types';

const Label = ({ nom }: { nom: string }) => (
  <div className="text-xs" style={{ color: colors.decisions.text.disabled.grey.default }}>
    {nom}
  </div>
);

export const TableauDeBordResumeDetails = (transparence: DetailedNominationSessionDto) => {
  const { dueDate, observationsClosingDate, positionStartDate } = transparence;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <div>
        <Label nom="Délai d'observation" />
        <div className="text-sm lining-nums">
          <FormattedMessage
            defaultMessage="{date, date, dateOnlyShort}"
            values={{ date: dateOnlyToDate(observationsClosingDate) }}
          />
        </div>
      </div>
      <div>
        <Label nom="Date d'écheance" />
        <div className="text-sm lining-nums">
          {dueDate ? (
            <FormattedMessage
              values={{ date: dateOnlyToDate(dueDate) }}
              defaultMessage="{date, date, dateOnlyShort}"
            />
          ) : (
            '-'
          )}
        </div>
      </div>
      <div>
        <Label nom="Date de prise de poste" />
        <div className="text-sm lining-nums">
          {positionStartDate ? (
            <FormattedMessage
              defaultMessage="{date, date, dateOnlyShort}"
              values={{ date: dateOnlyToDate(positionStartDate) }}
            />
          ) : (
            '-'
          )}
        </div>
      </div>
    </div>
  );
};
