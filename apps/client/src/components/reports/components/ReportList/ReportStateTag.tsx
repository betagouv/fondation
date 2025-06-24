import Tag, { type TagProps } from "@codegouvfr/react-dsfr/Tag";
import type { FC } from "react";

import { colors } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";

export type ReportStateTagProps = {
  state: ReportListItemVM["state"];
};

const statesSpec: {
  [key in ReportListItemVM["state"]]: {
    iconId: TagProps.WithIcon["iconId"];
    backgroundColor: string;
    color?: string;
  };
} = {
  Nouveau: {
    iconId: "fr-icon-folder-2-line",
    backgroundColor: colors.options.redMarianne._925_125.default,
    color: colors.options.redMarianne._425_625.default,
  },
  "En cours": {
    iconId: "ri-quill-pen-line",
    backgroundColor: colors.options.blueFrance._950_100.default,
    color: colors.options.blueFrance.sun113_625.default,
  },
  "Prêt à soutenir": {
    iconId: "fr-icon-file-text-line",
    backgroundColor: colors.options.greenEmeraude._950_100.default,
    color: colors.options.greenEmeraude.sun425moon753.default,
  },
  Soutenu: {
    iconId: "fr-icon-heart-line",
    backgroundColor: colors.options.grey._925_125.default,
    color: colors.options.grey._50_1000.default,
  },
};

export const ReportStateTag: FC<ReportStateTagProps> = ({ state }) => {
  const activeSpec = statesSpec[state];

  return (
    <Tag
      className={clsx("text-nowrap", cx("fr-px-4v"))}
      style={{
        backgroundColor: activeSpec.backgroundColor,
        color: activeSpec.color,
      }}
      iconId={activeSpec.iconId}
    >
      <span
        className={cx("fr-text--bold", "fr-ml-1v")}
        style={{
          color: activeSpec.color,
        }}
      >
        {state}
      </span>
    </Tag>
  );
};
