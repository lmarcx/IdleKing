"use client";

/**
 * Local, browser-only multi-document store for the level editor.
 *
 * Replaces the old single-slot localStorage keys (one map, one asset library)
 * with a real index so the Project Tree can list every saved document — maps
 * created under an Era, the Kingdom Draft, etc. — and load any of them by id.
 *
 * Dev tooling only: no backend, no sync. Promoting a document to canon game
 * content is still a manual export -> commit -> manifest step, same as before.
 */

export type EditorDocumentType = "playable_map" | "kingdom_draft";

export type EditorDocumentIndexEntry = Readonly<{
  id: string;
  type: EditorDocumentType;
  title: string;
  updatedAt: number;
  /** Optional grouping hint for the tree, e.g. "era_funebre" | "era_glaciaire". */
  origin?: string;
}>;

const INDEX_KEY = "aworlddreamt:editor:document-index";

function contentKey(type: EditorDocumentType, id: string): string {
  return `aworlddreamt:editor:doc:${type}:${id}`;
}

function readIndex(): EditorDocumentIndexEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as EditorDocumentIndexEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: readonly EditorDocumentIndexEntry[]): void {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export function listDocuments(type?: EditorDocumentType): EditorDocumentIndexEntry[] {
  const entries = readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
  return type ? entries.filter((entry) => entry.type === type) : entries;
}

export function saveDocument<T>(
  entry: { id: string; type: EditorDocumentType; title: string; origin?: string },
  content: T
): void {
  window.localStorage.setItem(contentKey(entry.type, entry.id), JSON.stringify(content));
  const nextEntries = readIndex().filter((item) => !(item.type === entry.type && item.id === entry.id));
  nextEntries.push({ id: entry.id, type: entry.type, title: entry.title, updatedAt: Date.now(), origin: entry.origin });
  writeIndex(nextEntries);
}

export function loadDocument<T>(type: EditorDocumentType, id: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(contentKey(type, id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function deleteDocument(type: EditorDocumentType, id: string): void {
  window.localStorage.removeItem(contentKey(type, id));
  writeIndex(readIndex().filter((item) => !(item.type === type && item.id === id)));
}

export function hasDocument(type: EditorDocumentType, id: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(contentKey(type, id)) !== null;
}
