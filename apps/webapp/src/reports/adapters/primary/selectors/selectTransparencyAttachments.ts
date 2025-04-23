import { FileVM, Magistrat, Transparency } from "shared-models";
import { createAppSelectorFactory } from "../../../../store/createAppSelector";

export type TransparencyAttachmentVM = {
  name: string;
  url: string;
};

export type TransparencyAttachmentsVM = TransparencyAttachmentVM[];

export const selectGdsTransparencyAttachmentsFactory = <
  T extends string = Transparency,
>() =>
  createAppSelectorFactory<T>()(
    [
      (state) => state.transparencies.GDS,
      (_, args: { transparency: T; formation: Magistrat.Formation }) => args,
    ],
    (transparenciesGDS, args): TransparencyAttachmentsVM => {
      const { transparency, formation } = args;

      return transparenciesGDS[transparency].files[formation].map(
        mapToViewModel,
      );
    },
  );

function mapToViewModel(file: FileVM): TransparencyAttachmentVM {
  return {
    name: file.name,
    url: file.signedUrl,
  };
}
