import Tag, { TagProps } from "@codegouvfr/react-dsfr/Tag";
import { FC } from "react";
import { ReportListItemVM } from "../../selectors/selectReportList";
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
    color: colors.options.blueFrance.sun113_625.default,
  },
  "En cours": {
    iconId: "ri-quill-pen-line",
    backgroundColor: colors.options.purpleGlycine._950_100.default,
    color: colors.options.purpleGlycine.sun319moon630.default,
  },
  "Prêt à soutenir": {
    iconId: "fr-icon-file-text-line",
    backgroundColor: colors.options.greenEmeraude._950_100.default,
    color: colors.options.greenMenthe.sun373moon652.default,
  },
  Soutenu: {
    iconId: "fr-icon-heart-line",
    backgroundColor: colors.options.brownCaramel._925_125.default,
    color: colors.options.yellowMoutarde.sun348moon860.default,
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
