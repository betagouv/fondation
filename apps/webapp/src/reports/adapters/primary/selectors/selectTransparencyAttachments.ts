import { FileVM, Transparency } from "shared-models";
import { createAppSelectorFactory } from "../../../../store/createAppSelector";

export type TransparencyAttachmentVM = {
  name: string;
  url: string;
};

export type TransparencyAttachmentsVM = {
  files: TransparencyAttachmentVM[];
};

export const selectGdsTransparencyAttachmentsFactory = <
  T extends string = Transparency,
>() =>
  createAppSelectorFactory<T>()(
    [
      (state) => state.transparencies.GDS,
      (_, args: { transparency: T }) => args,
    ],
    (transparenciesGDS, args): TransparencyAttachmentsVM => {
      const { transparency } = args;

      return {
        files: transparenciesGDS[transparency].files.map(mapToViewModel),
      };
    },
  );

function mapToViewModel(file: FileVM): TransparencyAttachmentVM {
  return {
    name: file.name,
    url: file.signedUrl,
  };
}
