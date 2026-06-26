import type { SessionState } from "./types";

// Simple in-memory store keyed by session ID.
// In production, replace with Redis or a database.
const store = new Map<string, SessionState>();

export function getSession(id: string): SessionState | undefined {
  return store.get(id);
}

export function setSession(id: string, state: SessionState): void {
  store.set(id, state);
}

export function newSession(): string {
  const id = Math.random().toString(36).slice(2, 10);
  store.set(id, { problemImage: null, answerImage: null, result: null });
  return id;
}
