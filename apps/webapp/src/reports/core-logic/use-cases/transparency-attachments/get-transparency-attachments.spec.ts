import { ApiFileGateway } from "../../../../files/adapters/secondary/gateways/ApiFile.gateway";
import { FakeFileApiClient } from "../../../../files/adapters/secondary/gateways/FakeFile.client";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ApiTransparencyGateway } from "../../../adapters/secondary/gateways/ApiTransparency.gateway";
import { FakeTransparencyApiClient } from "../../../adapters/secondary/gateways/FakeTransparency.client";
import { TransparencyAttachments } from "../../gateways/TransparencyApi.client";
import { getTransparencyAttachmentsFactory } from "./get-transparency-attachments";

const transparency = "transpa-test";

describe("Get Transparency Attachments", () => {
  let store: ReduxStore<true, ["transpa-test"]>;
  let initialState: AppState<true, ["transpa-test"]>;
  let transparencyClient: FakeTransparencyApiClient<["transpa-test"]>;
  let fileApiClient: FakeFileApiClient;

  beforeEach(() => {
    transparencyClient = new FakeTransparencyApiClient();
    const transparencyGateway = new ApiTransparencyGateway<["transpa-test"]>(
      transparencyClient,
    );

    fileApiClient = new FakeFileApiClient();
    const fileGateway = new ApiFileGateway(fileApiClient);

    store = initReduxStore<true, ["transpa-test"]>(
      {
        transparencyGateway,
        fileGateway,
      },
      {},
      {},
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ["transpa-test"],
    );
    initialState = store.getState();
  });

  it.only("gets attachments for a specific transparency", async () => {
    const attachments: TransparencyAttachments = {
      files: [
        {
          fileId: "file-id-1",
          metaPreSignedUrl: "https://example.com/api-endpoint/file-id-1",
        },
      ],
    };
    transparencyClient.addGdsFiles("transpa-test", attachments);

    fileApiClient.addFiles([
      {
        fileId: "file-id-1",
        name: "file-id-1-name",
        signedUrl: "https://example.com/signed-url/file-id-1-name",
      },
    ]);

    await store.dispatch(
      getTransparencyAttachmentsFactory<["transpa-test"]>()({
        transparency,
      }),
    );

    expect(store.getState()).toEqual<AppState<true, ["transpa-test"]>>({
      ...initialState,
      transparencies: {
        GDS: {
          [transparency]: {
            files: [
              {
                name: "file-id-1-name",
                signedUrl: "https://example.com/signed-url/file-id-1-name",
              },
            ],
          },
        },
      },
    });
  });
});
