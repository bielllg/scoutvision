"use client";

import { useSyncExternalStore } from "react";

export type SavedComparison = { id: string; players: number[]; metrics: string[]; date: string; revision?: string; pair?: [number, number] };
export type SavedCollection = { id: string; name: string; players: number[] };
export type SavedFilter = { id: string; name: string; href: string };
export type Personal = {
  favorites: number[];
  comparisons: SavedComparison[];
  collections: SavedCollection[];
  filters: SavedFilter[];
};

const key = "scoutvision.personal.v1";
const empty: Personal = { favorites: [], comparisons: [], collections: [], filters: [] };
let previousRaw: string | null = null;
let snapshot = empty;

function read() {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== previousRaw) {
      const data = raw ? JSON.parse(raw) : null;
      previousRaw = raw;
      snapshot = {
        favorites: Array.isArray(data?.favorites) ? data.favorites : [],
        comparisons: Array.isArray(data?.comparisons) ? data.comparisons : [],
        collections: Array.isArray(data?.collections) ? data.collections : [],
        filters: Array.isArray(data?.filters) ? data.filters : [],
      };
    }
  } catch {
    // A sessão ainda pode usar o estado em memória quando o armazenamento está bloqueado.
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(key, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(key, listener);
  };
}

function updatePersonal(update: (current: Personal) => Personal) {
  const next = update(read());
  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(key, serialized);
    previousRaw = serialized;
  } catch {
    // Preserve as alterações durante a sessão.
  }
  snapshot = next;
  window.dispatchEvent(new Event(key));
}

export function usePersonal(): [Personal, typeof updatePersonal] {
  return [useSyncExternalStore(subscribe, read, () => empty), updatePersonal];
}
