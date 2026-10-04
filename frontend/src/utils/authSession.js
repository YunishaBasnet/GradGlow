const AUTH_SESSION_KEY = "gradglow_auth_session";

export function getAuthSession() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(session) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function getAuthRole() {
  const session = getAuthSession();

  return session?.role || null;
}

export function getDashboardStudentId() {
  const session = getAuthSession();

  return (
    session?.studentId ??
    session?.student_id ??
    session?.student?.id ??
    session?.profile?.student_id ??
    null
  );
}

export function getAuthToken() {
  const session = getAuthSession();

  return session?.access_token ?? session?.accessToken ?? null;
}