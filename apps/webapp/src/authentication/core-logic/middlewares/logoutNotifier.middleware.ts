import { Middleware } from "@reduxjs/toolkit";
import { LogoutNotifierProvider } from "../providers/logoutNotifier.provider";
import { logout } from "../use-cases/logout/logout";

export const logoutNotifierMiddlewareFactory: (
  logoutNotifierProvider?: LogoutNotifierProvider,
) => Middleware =
  (logoutNotifierProvider) =>
  ({ dispatch }) =>
  (next) =>
  (action) => {
    if (logoutNotifierProvider) {
      const onNotification = () =>
        dispatch(logout.fulfilled(undefined, "", undefined));

      logoutNotifierProvider.listen(onNotification);
    }

    return next(action);
  };
