import { AttachedFileVM, ReportFileUsage } from "shared-models";
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

    const hasScreenshotFiles = report.attachedFiles?.find(
      (file) => file.usage === ReportFileUsage.EMBEDDED_SCREENSHOT,
    );
    if (report?.comment && report.attachedFiles && hasScreenshotFiles) {
      const container = document.createElement("div");
      container.innerHTML = report.comment;

      const screenshots = report.attachedFiles.filter(
        (file) => file.usage === ReportFileUsage.EMBEDDED_SCREENSHOT,
      );
      const images = container.querySelectorAll("img");

      images.forEach(setSrc(screenshots));

      report.comment = container.innerHTML;
    }

    return report;
  },
);

function setSrc(
  screenshots: AttachedFileVM[],
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
