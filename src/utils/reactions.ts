export interface Likeable {
  isLiked?: boolean;
  likedBy?: string[];
  likesCount: number;
}

export interface Bookmarkable {
  isBookmarked?: boolean;
  bookmarkedBy?: string[];
}

/** Server flag wins; otherwise derive the state from the list of user ids, if the API returned one. */
export function isLikedBy(item: Likeable, userId?: string): boolean {
  if (item.isLiked !== undefined) return item.isLiked;
  return Boolean(userId && item.likedBy?.includes(userId));
}

export function isBookmarkedBy(item: Bookmarkable, userId?: string): boolean {
  if (item.isBookmarked !== undefined) return item.isBookmarked;
  return Boolean(userId && item.bookmarkedBy?.includes(userId));
}

export function withToggledLike<T extends Likeable>(item: T, userId?: string): T {
  const next = !isLikedBy(item, userId);
  let likedBy = item.likedBy;
  if (likedBy && userId) {
    likedBy = next ? [...likedBy.filter((id) => id !== userId), userId] : likedBy.filter((id) => id !== userId);
  }
  return { ...item, isLiked: next, likedBy, likesCount: Math.max(0, item.likesCount + (next ? 1 : -1)) };
}

export function withToggledBookmark<T extends Bookmarkable>(item: T, userId?: string): T {
  const next = !isBookmarkedBy(item, userId);
  let bookmarkedBy = item.bookmarkedBy;
  if (bookmarkedBy && userId) {
    bookmarkedBy = next
      ? [...bookmarkedBy.filter((id) => id !== userId), userId]
      : bookmarkedBy.filter((id) => id !== userId);
  }
  return { ...item, isBookmarked: next, bookmarkedBy };
}
