import type { QueryClient } from "@tanstack/react-query";
import type { Post } from "../types";
import { mapItemInCache, removeItemFromCache } from "../utils/cache";
import { isRecord } from "../utils/normalize";
import { isPostDataKey, postKeys } from "./queryKeys";

/** Applies `patch` to a post in every cached feed, list and detail query. */
export function patchPostEverywhere(
  qc: QueryClient,
  postId: string,
  patch: (post: Post) => Post,
): void {
  qc.setQueriesData<unknown>(
    {
      queryKey: postKeys.all,
      predicate: (query) => isPostDataKey(query.queryKey),
    },
    (old: unknown) => mapItemInCache<Post>(old, postId, patch),
  );
}

/** Removes a post from every cached feed, list, author and scan collection and drops its detail query. */
export function removePostEverywhere(qc: QueryClient, postId: string): void {
  qc.setQueriesData<unknown>(
    {
      queryKey: postKeys.all,
      predicate: (query) => isPostDataKey(query.queryKey),
    },
    (old: unknown) => removeItemFromCache(old, postId),
  );
  qc.removeQueries({ queryKey: postKeys.detail(postId) });
  qc.removeQueries({ queryKey: ["comments", postId] });
}

/** Looks for a post inside already-cached feed/list pages (no network). */
export function findPostInCache(
  qc: QueryClient,
  postId: string,
): Post | undefined {
  const entries = qc.getQueriesData<unknown>({
    queryKey: postKeys.all,
    predicate: (query) =>
      query.queryKey[1] === "feed" || query.queryKey[1] === "list",
  });
  for (const [, data] of entries) {
    if (!isRecord(data) || !Array.isArray(data.pages)) continue;
    for (const page of data.pages as unknown[]) {
      if (!isRecord(page) || !Array.isArray(page.items)) continue;
      const found = (page.items as unknown[]).find(
        (item): item is Post => isRecord(item) && item.id === postId,
      );
      if (found) return found;
    }
  }
  return undefined;
}
