import { LoginNotifierProvider } from "../../../core-logic/providers/loginNotifier.provider";

export class LocalStorageLoginNotifierProvider
  implements LoginNotifierProvider
{
  static loginKey = "notifying-all-tabs-of-login";
  static notificationDelay = 1000;

  private endOfNotificationTimeout: number | undefined;

  notifyLogin(): void {
    localStorage.setItem(LocalStorageLoginNotifierProvider.loginKey, "true");

    this.endOfNotificationTimeout = window.setTimeout(() => {
      localStorage.removeItem(LocalStorageLoginNotifierProvider.loginKey);
    }, LocalStorageLoginNotifierProvider.notificationDelay);
  }

  listen(): void {
    window.addEventListener("storage", (event) => {
      if (event.key === LocalStorageLoginNotifierProvider.loginKey) {
        window.clearTimeout(this.endOfNotificationTimeout);
        window.location.reload();
      }
    });
  }
}
