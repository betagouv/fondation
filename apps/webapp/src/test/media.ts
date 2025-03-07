import sharp, { FormatEnum } from "sharp";

export const givenAnImage = async (
  format: Extract<keyof FormatEnum, "png" | "jpg">,
) => {
  return sharp({
    create: {
      width: 256,
      height: 256,
      channels: 3,
      background: { r: 128, g: 0, b: 0 },
    },
  }).toFormat(format);
};

export const givenAnImageBuffer = async (
  format: Extract<keyof FormatEnum, "png" | "jpg">,
) => {
  const fileBuffer = await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 3,
      background: { r: 128, g: 0, b: 0 },
    },
  })
    .toFormat(format)
    .toBuffer();

  return fileBuffer;
};
