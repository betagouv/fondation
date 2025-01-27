import { Middleware } from "@reduxjs/toolkit";
import { LogoutNotifierProvider } from "../providers/logoutNotifier.provider";
import { logout } from "../use-cases/logout/logout";

export const logoutNotifierMiddlewareFactory: (
  logoutNotifierProvider?: LogoutNotifierProvider,
) => Middleware =
  (logoutNotifierProvider) =>
  ({ dispatch }) => {
    if (logoutNotifierProvider) {
      const onNotification = () =>
        dispatch(logout.fulfilled(undefined, "", undefined));

      logoutNotifierProvider.listen(onNotification);
    }

    return (next) => (action) => next(action);
  };
