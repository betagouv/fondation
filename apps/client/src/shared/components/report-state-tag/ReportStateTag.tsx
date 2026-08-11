import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tag from '@codegouvfr/react-dsfr/Tag';

import { REPORT_STATUS_ENUM_LABEL, type ReportStatusEnum } from '@/types/enums.types';

const statesSpec: Record<ReportStatusEnum, { backgroundColor: string; color?: string }> = {
  NEW: {
    backgroundColor: colors.decisions.background.actionLow.redMarianne.default,
    color: colors.decisions.text.actionHigh.redMarianne.default,
  },
  IN_PROGRESS: {
    backgroundColor: colors.decisions.background.contrast.blueFrance.default,
    color: colors.decisions.text.actionHigh.blueFrance.default,
  },
  READY_TO_SUPPORT: {
    backgroundColor: colors.decisions.background.contrast.greenEmeraude.default,
    color: colors.decisions.text.actionHigh.greenEmeraude.default,
  },
  SUPPORTED: {
    backgroundColor: colors.decisions.background.disabled.grey.default,
    color: colors.decisions.text.mention.grey.default,
  },
};

export function ReportStateTag(props: { state: ReportStatusEnum }) {
  const activeSpec = statesSpec[props.state];

  return (
    <Tag
      className="min-h-7! py-0! text-[0.8125rem] text-nowrap"
      style={{ backgroundColor: activeSpec.backgroundColor, color: activeSpec.color }}
    >
      <span className={cx('fr-text--bold')} style={{ color: activeSpec.color }}>
        {REPORT_STATUS_ENUM_LABEL[props.state]}
      </span>
    </Tag>
  );
}
