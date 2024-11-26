import { fileTypeFromBuffer } from "file-type";
import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

type AttachReportFileParams = {
  reportId: string;
  file: File;
};

export const attachReportFile = createAppAsyncThunk<
  void,
  AttachReportFileParams
>(
  "report/attachFile",
  async (
    { reportId, file },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });

    const fileType = await fileTypeFromBuffer(fileBuffer);

    if (!fileType) {
      throw new Error("Invalid file type");
    }

    const acceptedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!fileType || !acceptedMimeTypes.includes(fileType.mime)) {
      throw new Error("Invalid file type");
    }

    return reportGateway.attachFile(reportId, file);
  },
);
