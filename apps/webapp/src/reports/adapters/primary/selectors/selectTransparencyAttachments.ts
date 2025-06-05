import { FileVM, Magistrat } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";

export type TransparencyAttachmentVM = {
  name: string;
  url: string;
};

export type TransparencyAttachmentsVM = TransparencyAttachmentVM[];

export const selectGdsTransparencyAttachments = createAppSelector(
  [
    (state) => state.transparencies.GDS,
    (_, args: { transparency: string; formation: Magistrat.Formation }) => args,
  ],
  (transparenciesGDS, args): TransparencyAttachmentsVM | null => {
    const { transparency, formation } = args;

    return (
      transparenciesGDS[transparency]?.[formation]?.files.map(mapToViewModel) ??
      null
    );
  },
);

function mapToViewModel(file: FileVM): TransparencyAttachmentVM {
  return {
    name: file.name,
    url: file.signedUrl,
  };
}
