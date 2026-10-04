import { clearAuthSession } from "./authSession";

export function logoutAndReload() {
  clearAuthSession();
  window.location.replace("/login");
}
