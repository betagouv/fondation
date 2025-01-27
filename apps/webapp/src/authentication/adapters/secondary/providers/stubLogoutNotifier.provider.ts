import { LogoutNotifierProvider } from "../../../core-logic/providers/logoutNotifier.provider";

export class StubLogoutNotifierProvider implements LogoutNotifierProvider {
  hasNotified = false;

  notifyLogout(): void {
    this.hasNotified = true;
  }
  listen(): void {
    this.hasNotified = true;
  }
}
