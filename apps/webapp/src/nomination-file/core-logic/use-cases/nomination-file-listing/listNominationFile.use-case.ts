import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const listNominationFile = createAppAsyncThunk(
  "nominationFiles/list",
  async (
    _,
    {
      extra: {
        gateways: { nominationFileGateway, authenticationGateway },
      },
    },
  ) => {
    const nominationFiles = await nominationFileGateway.list();
    const currentUser = authenticationGateway.getCurrentUser();

    if (currentUser)
      return nominationFiles.filter(
        (nominationFile) =>
          nominationFile.reporterName === currentUser.reporterName,
      );
  },
);
