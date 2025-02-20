import Tag, { TagProps } from "@codegouvfr/react-dsfr/Tag";
import { FC } from "react";
import { ReportListItemVM } from "../../selectors/selectReportList";
import { colors } from "@codegouvfr/react-dsfr";

export type ReportStateTagProps = {
  state: ReportListItemVM["state"];
};

const statesSpec: {
  [key in ReportListItemVM["state"]]: {
    iconId: TagProps.WithIcon["iconId"];
    backgroundColor: string;
  };
} = {
  Nouveau: {
    iconId: "fr-icon-folder-2-line",
    backgroundColor: colors.options.redMarianne._925_125.default,
  },
  "En cours": {
    iconId: "ri-quill-pen-line",
    backgroundColor: colors.options.purpleGlycine._950_100.default,
  },
  "Prêt à soutenir": {
    iconId: "fr-icon-file-text-line",
    backgroundColor: colors.options.greenEmeraude._950_100.default,
  },
  Soutenu: {
    iconId: "fr-icon-heart-line",
    backgroundColor: colors.options.brownCaramel._925_125.default,
  },
};

export const ReportStateTag: FC<ReportStateTagProps> = ({ state }) => {
  const activeSpec = statesSpec[state];

  return (
    <Tag
      style={{
        backgroundColor: activeSpec.backgroundColor,
      }}
      iconId={activeSpec.iconId}
    >
      {state}
    </Tag>
  );
};
