import { NominationsContextTransparenceRestContract } from "shared-models";
import { TransparenceSM } from "../../../../store/appState";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type GetTransparenceParams =
  NominationsContextTransparenceRestContract["endpoints"]["transparenceSnapshot"]["queryParams"];

export const getTransparence = createAppAsyncThunk<
  TransparenceSM,
  GetTransparenceParams
>(
  "secretariatGeneral/getTransparence",
  async (
    params,
    {
      extra: {
        gateways: { nominationsGateway },
      },
    },
  ) => {
    const transparence = await nominationsGateway.transparence(params);
    return transparence;
  },
);
