import { test } from "@playwright/experimental-ct-react";

export type Mount = Parameters<Parameters<typeof test>["2"]>[0]["mount"];

export type Page = Parameters<Parameters<typeof test>["2"]>[0]["page"];

export const logPlaywrightBrowser = (page: Page) => {
  page.on("console", (msg) => console.log(msg.text()));
};
