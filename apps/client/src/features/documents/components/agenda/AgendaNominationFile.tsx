import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { type ChangeEvent } from 'react';

import './AgendaNominationFile.css';

import { OutcomeBadge } from '@/shared/components/outcome-badge';
import { ReporterTagList } from '@/shared/components/reporter-tag';
import { Marked } from '@/shared/ui/Marked';
import type { FormationEnum } from '@/types/enums.types';
import { gradeAndPositionLabel } from '@/utils/position.utils';
import type { FoundAgendaNominationFiles } from '@api/types';

export function AgendaNominationFile(props: {
  checked: boolean;
  file: FoundAgendaNominationFiles['items'][number];
  formation: FormationEnum;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  search: string;
}) {
  return (
    <Checkbox
      className="anf fr-m-0"
      options={[
        {
          label: (
            <div className="fr-py-4v flex w-full items-start gap-1">
              <div className="w-[3ch] shrink-0">{props.file.number}</div>
              <div className="hidden w-[10%] min-w-28.5 shrink-0 md:block">
                <ReporterTagList max={2} reporters={props.file.reporters} />
              </div>
              <div
                className="fr-pl-2v w-1/3 shrink-0 cursor-help"
                title={gradeAndPositionLabel(
                  props.file.magistrat.position.grade,
                  props.file.magistrat.position.label,
                )}
              >
                <div className="truncate">
                  <Marked search={props.search} value={props.file.magistrat.name} />
                </div>
                <div className="cursor-help truncate text-xs">
                  {gradeAndPositionLabel(
                    props.file.magistrat.position.grade,
                    [props.file.magistrat.position.functionId, props.file.magistrat.position.jurisdictionId]
                      .filter((x) => !!x)
                      .join(' '),
                  ) || '-'}
                </div>
              </div>
              <i className={clsx(cx('ri-arrow-right-line'), 'shrink-0 before:size-5! before:content-[""]')} />
              <div
                className="fr-px-2v fr-pt-1v cursor-help text-sm text-wrap md:w-[30%]"
                title={
                  gradeAndPositionLabel(props.file.targetPosition.grade, props.file.targetPosition.label) ||
                  '-'
                }
              >
                {gradeAndPositionLabel(
                  props.file.targetPosition.grade,
                  [props.file.targetPosition.functionId, props.file.targetPosition.jurisdictionId]
                    .filter((x) => !!x)
                    .join(' '),
                ) || '-'}
              </div>
              <div className="hidden md:block">
                {props.file.outcome && (
                  <OutcomeBadge
                    acronym
                    formation={props.formation}
                    label={props.file.outcome.label}
                    outcome={props.file.outcome.value}
                  />
                )}
              </div>
            </div>
          ),
          nativeInputProps: {
            checked: props.checked,
            onChange: props.onChange,
            value: props.file.id,
          },
        },
      ]}
      small
    />
  );
}
