import { test, MountResult } from "@playwright/experimental-ct-react";

export type Mount = Parameters<Parameters<typeof test>["2"]>[0]["mount"];
export type Context = Parameters<Parameters<typeof test>["2"]>[0]["context"];
export type Page = Parameters<Parameters<typeof test>["2"]>[0]["page"];
export type Locator = ReturnType<MountResult["locator"]>;

export const logPlaywrightBrowser = (page: Page) => {
  page.on("console", (msg) => console.log(msg.text()));
};
