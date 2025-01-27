export interface LoginNotifierProvider {
  notifyLogin(): void;
  listen(): void;
}
