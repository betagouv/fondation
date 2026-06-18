import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tag, { type TagProps } from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import type { FC } from 'react';

import { REPORT_STATUS_ENUM_LABEL, type ReportStatusEnum } from '@/types/enums.types';

export type ReportStateTagProps = {
  state: ReportStatusEnum;
};

const statesSpec: Record<
  ReportStatusEnum,
  {
    iconId: TagProps.WithIcon['iconId'];
    backgroundColor: string;
    color?: string;
  }
> = {
  NEW: {
    iconId: 'fr-icon-folder-2-line',
    backgroundColor: colors.decisions.background.actionLow.redMarianne.default,
    color: colors.decisions.text.actionHigh.redMarianne.default,
  },
  IN_PROGRESS: {
    iconId: 'ri-quill-pen-line',
    backgroundColor: colors.decisions.background.contrast.blueFrance.default,
    color: colors.decisions.text.actionHigh.blueFrance.default,
  },
  READY_TO_SUPPORT: {
    iconId: 'fr-icon-file-text-line',
    backgroundColor: colors.decisions.background.contrast.greenEmeraude.default,
    color: colors.decisions.text.actionHigh.greenEmeraude.default,
  },
  SUPPORTED: {
    iconId: 'fr-icon-heart-line',
    backgroundColor: colors.decisions.background.disabled.grey.default,
    color: colors.decisions.text.actionHigh.grey.default,
  },
};

export const ReportStateTag: FC<ReportStateTagProps> = ({ state }) => {
  const activeSpec = statesSpec[state];
  const label = REPORT_STATUS_ENUM_LABEL[state];

  return (
    <Tag
      className={clsx('text-nowrap', cx('fr-px-4v'))}
      style={{
        backgroundColor: activeSpec.backgroundColor,
        color: activeSpec.color,
      }}
      iconId={activeSpec.iconId}
    >
      <span
        className={cx('fr-text--bold', 'fr-ml-1v')}
        style={{
          color: activeSpec.color,
        }}
      >
        {label}
      </span>
    </Tag>
  );
};
