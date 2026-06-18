import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import './AgendaNominationFile.css';

import { Marked } from '@/components/shared/Marked';
import { NominationFileOutcomeBadge } from '@/components/shared/nomination-files-table/components/cells/nomination-file-outcome/NominationFileOutcomeBadge';
import { UserAvatarList } from '@/components/shared/user-avatar';
import type { FormationEnum } from '@/types/enums.types';
import type { FoundDocsNominationFiles } from '@api/types';

export function AgendaNominationFile(props: {
  file: FoundDocsNominationFiles['items'][number];
  formation: FormationEnum;
  search: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Checkbox
      small
      className="anf fr-m-0"
      options={[
        {
          nativeInputProps: {
            onChange: props.onChange,
            value: props.file.id,
            checked: props.checked,
          },
          label: (
            <div className="fr-py-4v flex w-full items-start gap-1">
              <div className="w-[3ch] shrink-0">{props.file.number}</div>
              <div className="hidden w-[10%] md:block">
                <UserAvatarList users={props.file.reporters} max={2} size="sm" />
              </div>
              <div
                className="fr-pl-2v w-1/3 shrink-0 cursor-help"
                title={[props.file.magistrat.position.grade, props.file.magistrat.position.label].join(' - ')}
              >
                <div className="truncate">
                  <Marked value={props.file.magistrat.name} search={props.search} />
                </div>
                <div className="cursor-help truncate text-xs">
                  {[
                    props.file.magistrat.position.grade,
                    [props.file.magistrat.position.functionId, props.file.magistrat.position.jurisdictionId]
                      .filter((x) => !!x)
                      .join(' '),
                  ]
                    .filter((x) => !!x)
                    .join(' - ') || '-'}
                </div>
              </div>
              <i className={clsx(cx('ri-arrow-right-line'), 'shrink-0 before:size-5! before:content-[""]')} />
              <div
                className="fr-px-2v fr-pt-1v cursor-help text-sm text-wrap md:w-[30%]"
                title={
                  [props.file.magistrat.position.grade, props.file.targetPosition.label]
                    .filter((x) => !!x)
                    .join(' - ') || '-'
                }
              >
                {[
                  props.file.targetPosition.grade,
                  [props.file.targetPosition.functionId, props.file.targetPosition.jurisdictionId]
                    .filter((x) => !!x)
                    .join(' '),
                ]
                  .filter((x) => !!x)
                  .join(' - ') || '-'}
              </div>
              <div className="hidden md:block">
                {props.file.outcome && (
                  <NominationFileOutcomeBadge
                    short
                    formation={props.formation}
                    outcome={props.file.outcome.value}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
