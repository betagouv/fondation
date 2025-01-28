import { LogoutNotifierProvider } from "../../../core-logic/providers/logoutNotifier.provider";

export class LocalStorageLogoutNotifierProvider
  implements LogoutNotifierProvider
{
  static logoutKey = "notifying-all-tabs-of-logout";
  static notificationDelay = 1000;

  private endOfNotificationTimeout: number | undefined;

  notifyLogout(): void {
    localStorage.setItem(LocalStorageLogoutNotifierProvider.logoutKey, "true");

    this.endOfNotificationTimeout = window.setTimeout(() => {
      localStorage.removeItem(LocalStorageLogoutNotifierProvider.logoutKey);
    }, LocalStorageLogoutNotifierProvider.notificationDelay);
  }

  listen(onNotification: () => void): void {
    window.addEventListener("storage", (event) => {
      if (event.key === LocalStorageLogoutNotifierProvider.logoutKey) {
        window.clearTimeout(this.endOfNotificationTimeout);
        onNotification();
      }
    });
  }
}
