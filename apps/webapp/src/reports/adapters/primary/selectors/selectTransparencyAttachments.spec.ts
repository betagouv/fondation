import { FileVM, Magistrat } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { getTransparencyAttachments } from "../../../core-logic/use-cases/transparency-attachments/get-transparency-attachments";
import {
  selectGdsTransparencyAttachments,
  TransparencyAttachmentsVM,
} from "./selectTransparencyAttachments";

const aFormation = Magistrat.Formation.PARQUET;

describe("Select Transparency Attachments", () => {
  let store: ReduxStore;
  let selectedAttachments: TransparencyAttachmentsVM | null;

  beforeEach(() => {
    store = initReduxStore(
      {},
      {},
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it("shows nothing when no attachments exist", () => {
    selectAttachments("transpa-test");
    expectAttachments(null);
  });

  describe("When there are attachments for a specific transparency", () => {
    const transpaTestFiles: FileVM[] = [
      {
        name: "document1.pdf",
        signedUrl: "https://example.com/file1",
      },
      {
        name: "document2.pdf",
        signedUrl: "https://example.com/file2",
      },
    ];

    beforeEach(() => {
      givenTransparencyAttachments("transpa-test", transpaTestFiles);
    });

    it("returns all files when no filter is applied", () => {
      selectAttachments("transpa-test");
      expectAttachments(transpaTestFiles);
    });

    it("returns only files for the specified transparency when filter is applied", () => {
      selectAttachments("transpa-test");
      expectAttachments(transpaTestFiles);
    });

    it("returns nothing when filtering by transparency with no attachments", () => {
      selectAttachments("other-transpa-test");
      expectAttachments(null);
    });
  });

  const givenTransparencyAttachments = (
    transparency: "transpa-test",
    files: FileVM[],
  ) => {
    store.dispatch(
      getTransparencyAttachments.fulfilled(files, "", {
        transparency,
        formation: aFormation,
      }),
    );
  };

  const selectAttachments = (
    transparency: "transpa-test" | "other-transpa-test",
  ) => {
    selectedAttachments = selectGdsTransparencyAttachments(store.getState(), {
      transparency,
      formation: aFormation,
    });
  };

  const expectAttachments = (expectedFiles: FileVM[] | null) => {
    expect(selectedAttachments).toEqual<TransparencyAttachmentsVM | null>(
      expectedFiles?.map((file) => ({
        name: file.name,
        url: file.signedUrl,
      })) ?? null,
    );
  };
});
