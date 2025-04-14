import blobStream from "blob-stream";
import PDF from "pdfkit";

export const givenAPdf = async () => {
  return new Promise<Blob>((resolve, reject) => {
    const pdfDoc = new PDF();
    pdfDoc.text("Some content.");
    pdfDoc.end();

    const stream = pdfDoc.pipe(blobStream());

    stream.on("finish", function () {
      resolve(stream.toBlob("application/pdf"));
    });
    stream.on("error", reject);
  });
};
