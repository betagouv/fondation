import { Middleware } from "@reduxjs/toolkit";
import { LoginNotifierProvider } from "../providers/loginNotifier.provider";

export const loginNotifierMiddlewareFactory: (
  loginNotifierProvider?: LoginNotifierProvider,
) => Middleware = (loginNotifierProvider) => () => {
  if (loginNotifierProvider) loginNotifierProvider.listen();
  return (next) => (action) => next(action);
};
