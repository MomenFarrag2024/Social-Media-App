/**
 * Domain types used by the UI.
 *
 * The Route Posts documentation confirms endpoints and the response envelope
 * ({ success, message, data, meta }) but NOT the exact shape of `data`.
 * The raw payload is therefore mapped into these types inside `src/api/normalizers.ts`.
 * Every mapping that is an assumption is marked "ASSUMPTION" there.
 */

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: unknown;
}

export interface ApiFieldIssue {
  field?: string;
  message: string;
}

export interface UserStats {
  followers?: number;
  following?: number;
  bookmarks?: number;
  posts?: number;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  photo?: string;
  bio?: string;
  /** Cover/banner image URL, only when the profile payload includes one (see the cover-photo integration point). */
  cover?: string;
  /** ASSUMPTION: returned by the profile payload; shown only when present. */
  gender?: string;
  dateOfBirth?: string;
  /** Account creation timestamp as supplied by the API (never synthesised). */
  createdAt?: string;
  /** Ids of users this user follows / is followed by, when the payload includes those arrays. */
  followingIds?: string[];
  followersIds?: string[];
  /** Full user objects, only when the API returns populated arrays (bare ids cannot be displayed). */
  followersList?: User[];
  followingList?: User[];
  /** Whether the signed-in user follows this user, when the API says so directly. */
  isFollowing?: boolean;
  stats: UserStats;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  image?: string;
  author: User;
  createdAt?: string;
  likesCount: number;
  isLiked?: boolean;
  likedBy?: string[];
  repliesCount?: number;
  parentId?: string;
}

export interface Post {
  id: string;
  body: string;
  image?: string;
  author: User;
  createdAt?: string;
  likesCount: number;
  isLiked?: boolean;
  likedBy?: string[];
  commentsCount?: number;
  sharesCount?: number;
  isBookmarked?: boolean;
  bookmarkedBy?: string[];
  topComment?: Comment;
  sharedPost?: Post;
  privacy?: string;
}

export interface AppNotification {
  id: string;
  type?: string;
  isRead: boolean;
  createdAt?: string;
  actor?: User;
  text: string;
  postId?: string;
  commentId?: string;
}

export type FeedFilter = 'all' | 'following' | 'me';

export interface Page<T> {
  items: T[];
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null;
}

export interface AuthResult {
  token: string;
  user: User | null;
}

/** Router state passed from author links to the public profile page (best-effort, may be stale). */
export interface UserLocationState {
  user: User;
}

/** Router state passed from feed cards to the post details page. */
export interface PostLocationState {
  post: Post;
}
