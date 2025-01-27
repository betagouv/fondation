export interface LogoutNotifierProvider {
  notifyLogout(): void;
  listen(onNotification: () => void): void;
}
