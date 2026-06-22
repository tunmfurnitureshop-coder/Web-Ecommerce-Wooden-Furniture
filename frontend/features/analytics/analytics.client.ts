import type { TrackEventRequest } from "./analytics.types";

const ANON_ID_KEY = "vin_anon_id";

function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function trackEvent(event: Omit<TrackEventRequest, "anonymousId">): void {
  if (typeof window === "undefined") return;
  const body: TrackEventRequest = {
    ...event,
    anonymousId: getOrCreateAnonId(),
    sourcePage: event.sourcePage ?? window.location.pathname,
    referrer: event.referrer ?? (document.referrer || undefined),
  };
  // Fire-and-forget — never block or throw
  fetch("/api/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
