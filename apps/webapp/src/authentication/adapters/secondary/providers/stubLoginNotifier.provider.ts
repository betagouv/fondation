import { LoginNotifierProvider } from "../../../core-logic/providers/loginNotifier.provider";

export class StubLoginNotifierProvider implements LoginNotifierProvider {
  hasNotified = false;

  notifyLogin(): void {
    this.hasNotified = true;
  }
  listen(): void {
    this.hasNotified = true;
  }
}
