"use client";

import { useSyncExternalStore } from "react";

const LOCATION_HASH_CHANGE_EVENT = "lead-intel:location-hash-change";

let hasPatchedHistory = false;

function dispatchLocationHashChange() {
  window.dispatchEvent(new Event(LOCATION_HASH_CHANGE_EVENT));
}

function ensureHistoryEvents() {
  if (typeof window === "undefined" || hasPatchedHistory) return;

  hasPatchedHistory = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function pushState(...args) {
    const result = originalPushState(...args);
    dispatchLocationHashChange();
    return result;
  };

  window.history.replaceState = function replaceState(...args) {
    const result = originalReplaceState(...args);
    dispatchLocationHashChange();
    return result;
  };
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureHistoryEvents();

  window.addEventListener(LOCATION_HASH_CHANGE_EVENT, onStoreChange);
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener(LOCATION_HASH_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return "";
  return window.location.hash;
}

export function useLocationHash() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}
