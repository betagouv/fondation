import { ReportScreenshotSM } from "../../../../store/appState.ts";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk.ts";

export const retrieveReport = createAppAsyncThunk(
  "report/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { reportGateway },
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

      images.forEach(setSrc(screenshots));

      report.comment = container.innerHTML;
    }

    return report;
  },
);

function setSrc(
  screenshots: ReportScreenshotSM[],
): (value: HTMLImageElement) => void {
  return (img) => {
    const imgFileName = img.getAttribute("data-file-name");
    const screenshot = screenshots.find((file) => file.name === imgFileName);
    if (!screenshot) {
      console.warn(`Screenshot ${imgFileName} not found`);
      return;
    }
    img.setAttribute("src", screenshot.signedUrl);
  };
}
