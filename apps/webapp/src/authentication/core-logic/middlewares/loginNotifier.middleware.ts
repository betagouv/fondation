import { Middleware } from "@reduxjs/toolkit";
import { LoginNotifierProvider } from "../providers/loginNotifier.provider";

export const loginNotifierMiddlewareFactory: (
  loginNotifierProvider?: LoginNotifierProvider,
) => Middleware = (loginNotifierProvider) => () => (next) => (action) => {
  if (loginNotifierProvider) loginNotifierProvider.listen();
  return next(action);
};
