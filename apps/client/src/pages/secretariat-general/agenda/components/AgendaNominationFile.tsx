import './AgendaNominationFile.css';

import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { Marked } from '@/components/shared/Marked';
import { NominationFileOutcomeBadge } from '@/components/shared/nomination-files-table/components/cells/nomination-file-outcome/NominationFileOutcomeBadge';
import type { FormationEnum } from '@/types/enums.types';
import type { FoundAgendaNominationFiles } from '@api/types';

export function AgendaNominationFile(props: {
  file: FoundAgendaNominationFiles['items'][number];
  formation: FormationEnum;
  search: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Checkbox
      small
      className="anf m-0"
      options={[
        {
          nativeInputProps: { onChange: props.onChange, value: props.file.id, checked: props.checked },
          label: (
            <div className="flex w-full items-start gap-1 py-4">
              <div className="w-[3ch] flex-shrink-0">{props.file.number}</div>
              <div>
                <NominationFileOutcomeBadge formation={props.formation} outcome={props.file.outcome.value} />
              </div>
              <div className="w-1/3 flex-shrink-0 pl-2">
                <div className="truncate">
                  <Marked value={props.file.name} search={props.search} />
                </div>
                <div
                  className="truncate text-xs"
                  title={[props.file.grade, props.file.currentPosition].join(' - ')}
                >
                  {[props.file.grade, props.file.currentPosition].filter((x) => !!x).join(' - ') || '-'}
                </div>
              </div>
              <i
                className={clsx(cx('ri-arrow-right-line'), 'flex-shrink-0 before:size-5 before:content-[""]')}
              />
              <div className="text-wrap px-2 pt-1 text-sm">
                {[props.file.targetedGrade, props.file.targetedPosition].filter((x) => !!x).join(' - ') ||
                  '-'}
              </div>
            </div>
          )
        }
      ]}
    />
  );
}
