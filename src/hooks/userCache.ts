import type { QueryClient } from '@tanstack/react-query';
import type { Post, User } from '../types';
import { isRecord } from '../utils/normalize';

const MAX_DEPTH = 10;

/** Calls `visit` for every object found anywhere inside the cached query data. */
function walkCache(qc: QueryClient, visit: (value: Record<string, unknown>) => void): void {
  const seen = new WeakSet<object>();
  const walk = (value: unknown, depth: number): void => {
    if (depth > MAX_DEPTH || typeof value !== 'object' || value === null || seen.has(value)) return;
    seen.add(value);
    if (isRecord(value)) visit(value);
    const children: unknown[] = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) walk(child, depth + 1);
  };
  for (const query of qc.getQueryCache().getAll()) walk(query.state.data, 0);
}

function isUser(value: Record<string, unknown>): value is Record<string, unknown> & User {
  return typeof value.id === 'string' && typeof value.name === 'string' && isRecord(value.stats);
}

function isPost(value: Record<string, unknown>): value is Record<string, unknown> & Post {
  return (
    typeof value.id === 'string' &&
    typeof value.body === 'string' &&
    typeof value.likesCount === 'number' &&
    isRecord(value.author)
  );
}

function richness(user: User): number {
  const stats = Object.values(user.stats).filter((value) => value !== undefined).length;
  return (user.photo ? 1 : 0) + (user.username ? 1 : 0) + (user.bio ? 1 : 0) + stats;
}

/** Keeps whichever of two copies of a user carries more information. */
export function richerUser(a: User | undefined, b: User | undefined): User | undefined {
  if (!a) return b;
  if (!b) return a;
  return richness(b) > richness(a) ? b : a;
}

/** Finds the most complete copy of a user among already-cached posts, comments, likes, suggestions, etc. */
export function findUserInCache(qc: QueryClient, userId: string): User | undefined {
  let best: User | undefined;
  walkCache(qc, (value) => {
    if (isUser(value) && value.id === userId) best = richerUser(best, value);
  });
  return best;
}

/** Posts written by `userId` that are already in the cache (no network). */
export function findPostsByAuthorInCache(qc: QueryClient, userId: string): Post[] {
  const found = new Map<string, Post>();
  walkCache(qc, (value) => {
    if (isPost(value) && value.author.id === userId) found.set(value.id, value);
  });
  return [...found.values()];
}

/** Every distinct user (with an id) found in already-cached data, richest copy per id. No network. */
export function collectUsersFromCache(qc: QueryClient): User[] {
  const users = new Map<string, User>();
  walkCache(qc, (value) => {
    if (isUser(value) && value.id) users.set(value.id, richerUser(users.get(value.id), value) ?? value);
  });
  return [...users.values()];
}
