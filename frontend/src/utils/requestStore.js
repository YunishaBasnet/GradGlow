const REQUESTS_STORAGE_KEY = "gradglow_requests_store";
const REQUESTS_UPDATED_EVENT = "gradglow:requests-updated";

function safeJsonParse(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRequests() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REQUESTS_STORAGE_KEY);
  return safeJsonParse(raw);
}

function writeRequests(requests) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new CustomEvent(REQUESTS_UPDATED_EVENT));
}

export function getStoredRequests() {
  return readRequests();
}

export function createStoredRequest(partial) {
  const request = {
    id: partial.id || `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: partial.title || "Request",
    type: partial.type || "general",
    status: partial.status || "pending",
    submittedAt: partial.submittedAt || new Date().toISOString(),
    ...partial,
  };

  const current = readRequests();
  const next = [request, ...current];
  writeRequests(next);
  return request;
}

export function updateStoredRequestStatus(requestId, nextStatus) {
  const normalized = String(nextStatus || "").toLowerCase();
  const status = normalized === "approved" || normalized === "rejected" || normalized === "pending" ? normalized : "pending";

  const current = readRequests();
  const next = current.map((item) =>
    item.id === requestId
      ? {
          ...item,
          status,
          reviewedAt: new Date().toISOString(),
        }
      : item
  );
  writeRequests(next);
}

export function subscribeToStoredRequests(onChange) {
  if (typeof window === "undefined" || typeof onChange !== "function") return () => {};

  const handleUpdate = () => onChange(getStoredRequests());
  const handleStorage = (event) => {
    if (event.key === REQUESTS_STORAGE_KEY) handleUpdate();
  };

  window.addEventListener(REQUESTS_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(REQUESTS_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}
