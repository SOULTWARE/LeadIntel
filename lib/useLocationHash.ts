"use client";

import { useSyncExternalStore } from "react";

const LOCATION_HASH_CHANGE_EVENT = "lead-intel:location-hash-change";

let hasPatchedHistory = false;
let pendingLocationHashChangeTimeout: number | null = null;

function dispatchLocationHashChange() {
  pendingLocationHashChangeTimeout = null;
  window.dispatchEvent(new Event(LOCATION_HASH_CHANGE_EVENT));
}

function scheduleLocationHashChange() {
  if (pendingLocationHashChangeTimeout !== null) return;

  // Defer subscriber updates until after navigation settles so we don't
  // trigger React updates during Next.js insertion effects.
  pendingLocationHashChangeTimeout = window.setTimeout(() => {
    dispatchLocationHashChange();
  }, 0);
}

function ensureHistoryEvents() {
  if (typeof window === "undefined" || hasPatchedHistory) return;

  hasPatchedHistory = true;

  const nativePushState = History.prototype.pushState;
  const nativeReplaceState = History.prototype.replaceState;

  window.history.pushState = function pushState(...args) {
    const result = nativePushState.apply(window.history, args);
    scheduleLocationHashChange();
    return result;
  };

  window.history.replaceState = function replaceState(...args) {
    const result = nativeReplaceState.apply(window.history, args);
    scheduleLocationHashChange();
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
