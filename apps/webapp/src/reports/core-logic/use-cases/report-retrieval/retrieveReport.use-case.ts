import { FileVM } from "shared-models";
import { ReportScreenshotSM } from "../../../../store/appState.ts";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk.ts";

export const retrieveReport = createAppAsyncThunk(
  "report/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { reportGateway, fileGateway },
      },
    },
  ) => {
    const report = await reportGateway.retrieveReport(id);

    const screenshots = report.contentScreenshots?.files;
    const hasScreenshotFiles = !!screenshots?.length;

    if (report?.comment && hasScreenshotFiles) {
      const container = document.createElement("div");
      container.innerHTML = report.comment;

      const images = container.querySelectorAll("img");

      const signedUrlsVM = await fileGateway.getSignedUrls(
        screenshots
          .filter((screenshot) => screenshot.fileId !== null)
          .map((screenshot) => screenshot.fileId!),
      );
      images.forEach(setSrc(screenshots, signedUrlsVM));

      report.comment = container.innerHTML;
    }

    return report;
  },
);

function setSrc(
  screenshots: ReportScreenshotSM[],
  signedUrlsVM: FileVM[],
): (value: HTMLImageElement) => void {
  return (img) => {
    const imgFileName = img.getAttribute("data-file-name");
    const screenshot = screenshots.find((file) => file.name === imgFileName);
    if (!screenshot) {
      console.warn(`Screenshot ${imgFileName} not found`);
      return;
    }

    const signedUrlVM = signedUrlsVM.find(
      (file) => file.name === screenshot.name,
    );

    if (signedUrlVM) {
      img.setAttribute("src", signedUrlVM.signedUrl);
    }
  };
}
