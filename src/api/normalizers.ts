/**
 * All mapping from raw API payloads to UI models lives here.
 *
 * The documentation confirms the response envelope but not the shape of `data`,
 * so each mapper accepts several plausible key names. Anything marked ASSUMPTION
 * must be verified against real responses (see README, "Known API assumptions").
 */
import type { ApiEnvelope, AppNotification, Comment, Page, Post, User } from '../types';
import {
  asBoolean,
  asNumber,
  asString,
  countOf,
  idOf,
  isDefined,
  isRecord,
  isString,
  pick,
  urlOf,
  type UnknownRecord,
} from '../utils/normalize';

export const UNKNOWN_USER: User = { id: '', name: 'Unknown user', stats: {} };

function joinName(record: UnknownRecord): string | undefined {
  const first = asString(record.firstName);
  const last = asString(record.lastName);
  const full = [first, last].filter(isDefined).join(' ');
  return full || undefined;
}

export function normalizeUser(raw: unknown): User | null {
  return buildUser(raw, true);
}

/** Entries must be objects to be displayable; an array of bare ids means "list not available". */
function userList(value: unknown): User[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const users = value
    .filter(isRecord)
    .map((entry) => buildUser(entry, false))
    .filter(isDefined);
  if (value.length > 0 && users.length === 0) return undefined;
  return users;
}

/** `withRelations` is false for users nested inside follower/following lists to keep mapping shallow. */
function buildUser(raw: unknown, withRelations: boolean): User | null {
  if (typeof raw === 'string') return raw ? { id: raw, name: 'User', stats: {} } : null;
  if (!isRecord(raw)) return null;
  const id = idOf(raw);
  const username = asString(raw.username);
  const name = asString(raw.name) ?? joinName(raw) ?? username;
  if (!id && !name) return null;
  return {
    id: id ?? '',
    name: name ?? 'Unknown user',
    username,
    email: asString(raw.email),
    // ASSUMPTION: photo key name (photo / profilePhoto / avatar ...), string URL or { url }.
    photo: urlOf(pick(raw, ['photo', 'profilePhoto', 'avatar', 'profileImage', 'image'])),
    bio: asString(raw.bio),
    // ASSUMPTION: cover key name. This is the retrieval integration point: adjust the key to the real field.
    cover: urlOf(pick(raw, ['cover', 'coverPhoto', 'coverImage', 'banner'])),
    // ASSUMPTION: profile payload field names (gender / dateOfBirth / createdAt); shown only when present.
    gender: asString(raw.gender),
    dateOfBirth: asString(pick(raw, ['dateOfBirth', 'birthDate', 'dob'])),
    createdAt: asString(raw.createdAt),
    // ASSUMPTION: follow state may be a direct boolean on the user.
    isFollowing: asBoolean(pick(raw, ['isFollowing', 'followedByMe', 'isFollowed'])),
    // ASSUMPTION: `followers` / `following` are arrays of ids or populated users.
    followersIds: withRelations ? idList(raw.followers) : undefined,
    followingIds: withRelations ? idList(raw.following) : undefined,
    followersList: withRelations ? userList(raw.followers) : undefined,
    followingList: withRelations ? userList(raw.following) : undefined,
    // ASSUMPTION: stats may be numeric counts or arrays of ids.
    stats: {
      followers: countOf(raw, ['followersCount', 'followers']),
      following: countOf(raw, ['followingCount', 'following']),
      bookmarks: countOf(raw, ['bookmarksCount', 'bookmarks']),
      posts: countOf(raw, ['postsCount', 'posts']),
    },
  };
}

function idList(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map(idOf).filter(isString) : undefined;
}

export function normalizeComment(raw: unknown, fallbackPostId = ''): Comment | null {
  if (!isRecord(raw)) return null;
  const id = idOf(raw);
  if (!id) return null;
  const likes = pick(raw, ['likes', 'likedBy']);
  const likedBy = idList(likes);
  return {
    id,
    postId: idOf(pick(raw, ['post', 'postId'])) ?? fallbackPostId,
    // ASSUMPTION: comment text key is `content` (alternatives: body, text).
    content: asString(pick(raw, ['content', 'body', 'text'])) ?? '',
    image: urlOf(raw.image),
    // ASSUMPTION: author key (commentCreator / user / author / createdBy).
    author: normalizeUser(pick(raw, ['commentCreator', 'user', 'author', 'createdBy'])) ?? UNKNOWN_USER,
    createdAt: asString(raw.createdAt),
    likesCount: asNumber(pick(raw, ['likesCount', 'likeCount'])) ?? asNumber(likes) ?? likedBy?.length ?? 0,
    isLiked: asBoolean(pick(raw, ['isLiked', 'liked', 'likedByMe'])),
    likedBy,
    repliesCount: countOf(raw, ['repliesCount', 'repliesNumber', 'replies']),
    parentId: idOf(pick(raw, ['parentComment', 'parentId', 'parent'])),
  };
}

export function normalizePost(raw: unknown, depth = 0): Post | null {
  if (!isRecord(raw)) return null;
  const id = idOf(raw);
  if (!id) return null;

  const likes = pick(raw, ['likes', 'likedBy']);
  const likedBy = idList(likes);
  const bookmarkedBy = idList(raw.bookmarkedBy);
  const topCommentRaw = pick(raw, ['topComment', 'latestComment', 'firstComment']);
  const sharedRaw = depth < 2 ? pick(raw, ['sharedPost', 'originalPost', 'sharedFrom']) : undefined;

  return {
    id,
    // ASSUMPTION: the post text is returned as `body` (as accepted on create).
    body: asString(pick(raw, ['body', 'content', 'text'])) ?? '',
    image: urlOf(pick(raw, ['image', 'images'])),
    // ASSUMPTION: author key (user / author / createdBy / owner).
    author: normalizeUser(pick(raw, ['user', 'author', 'createdBy', 'owner'])) ?? UNKNOWN_USER,
    createdAt: asString(raw.createdAt),
    likesCount: asNumber(pick(raw, ['likesCount', 'likeCount'])) ?? asNumber(likes) ?? likedBy?.length ?? 0,
    isLiked: asBoolean(pick(raw, ['isLiked', 'liked', 'likedByMe'])),
    likedBy,
    commentsCount: countOf(raw, ['commentsCount', 'commentCount', 'comments']),
    sharesCount: countOf(raw, ['sharesCount', 'shareCount']),
    isBookmarked: asBoolean(pick(raw, ['isBookmarked', 'bookmarked'])),
    bookmarkedBy,
    topComment: topCommentRaw ? (normalizeComment(topCommentRaw, id) ?? undefined) : undefined,
    // ASSUMPTION: a share post references the original under sharedPost / originalPost / sharedFrom.
    sharedPost: sharedRaw ? (normalizePost(sharedRaw, depth + 1) ?? undefined) : undefined,
    privacy: asString(raw.privacy),
  };
}

function describeNotification(type: string | undefined): string {
  const t = (type ?? '').toLowerCase();
  if (t.includes('reply')) return 'replied to your comment';
  if (t.includes('like')) return t.includes('comment') ? 'liked your comment' : 'liked your post';
  if (t.includes('comment')) return 'commented on your post';
  if (t.includes('share')) return 'shared your post';
  if (t.includes('follow')) return 'started following you';
  if (t.includes('mention')) return 'mentioned you';
  return 'sent you a notification';
}

export function normalizeNotification(raw: unknown): AppNotification | null {
  if (!isRecord(raw)) return null;
  const id = idOf(raw);
  if (!id) return null;

  const type = asString(pick(raw, ['type', 'action']));
  // ASSUMPTION: actor key (actor / sender / from / user).
  const actor = normalizeUser(pick(raw, ['actor', 'sender', 'from', 'user'])) ?? undefined;
  const entity = isRecord(raw.entity) ? raw.entity : undefined;
  const entityType = (asString(raw.entityType) ?? (entity ? asString(entity.type) : undefined))?.toLowerCase();

  const postId =
    idOf(pick(raw, ['post', 'postId'])) ??
    (entity ? idOf(pick(entity, ['post', 'postId'])) : undefined) ??
    (entityType === 'post' ? (asString(raw.entityId) ?? (entity ? idOf(entity) : undefined)) : undefined);
  const commentId =
    idOf(pick(raw, ['comment', 'commentId'])) ??
    (entityType === 'comment' ? (asString(raw.entityId) ?? (entity ? idOf(entity) : undefined)) : undefined);

  const message = asString(pick(raw, ['message', 'text', 'content', 'title']));
  const text = message ?? `${actor?.name ?? 'Someone'} ${describeNotification(type)}`;

  return {
    id,
    type,
    isRead: asBoolean(pick(raw, ['isRead', 'read'])) ?? Boolean(raw.readAt),
    createdAt: asString(raw.createdAt),
    actor,
    text,
    postId,
    commentId,
  };
}

/** Returns the first array found in `data`: under one of `keys`, or the first array-valued property. */
export function extractArray(data: unknown, keys: readonly string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data)) {
    for (const key of keys) {
      const value = data[key];
      if (Array.isArray(value)) return value;
    }
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

/**
 * ASSUMPTION: pagination info lives in `meta` (optionally `meta.pagination`) using common names
 * (nextPage / hasNextPage / currentPage + numberOfPages|totalPages). When none is present, a full
 * page is treated as "there may be more".
 */
export function parseNextPage(meta: unknown, itemCount: number, page: number, limit: number): number | null {
  const sources: UnknownRecord[] = [];
  if (isRecord(meta)) {
    sources.push(meta);
    if (isRecord(meta.pagination)) sources.push(meta.pagination);
  }
  for (const source of sources) {
    const next = asNumber(source.nextPage);
    if (next !== undefined) return next;
    if ('nextPage' in source && source.nextPage === null) return null;
    const hasNext = asBoolean(source.hasNextPage ?? source.hasMore);
    if (hasNext !== undefined) return hasNext ? page + 1 : null;
    const current = asNumber(source.currentPage ?? source.page);
    const total = asNumber(source.numberOfPages ?? source.totalPages ?? source.pages);
    if (current !== undefined && total !== undefined) return current < total ? current + 1 : null;
  }
  return itemCount >= limit ? page + 1 : null;
}

export function parsePage<T>(
  envelope: ApiEnvelope,
  map: (raw: unknown) => T | null,
  listKeys: readonly string[],
  page: number,
  limit: number,
): Page<T> {
  const items = extractArray(envelope.data, listKeys).map(map).filter(isDefined);
  return { items, nextPage: parseNextPage(envelope.meta, items.length, page, limit) };
}

export function parseCount(data: unknown): number {
  const direct = asNumber(data);
  if (direct !== undefined) return direct;
  if (isRecord(data)) return asNumber(pick(data, ['count', 'unreadCount', 'unread', 'total'])) ?? 0;
  return 0;
}
