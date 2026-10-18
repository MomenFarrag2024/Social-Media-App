# Social Media App

An Instagram-inspired social app for the Route Academy Posts API (`https://route-posts.routemisr.com`).
Stack: React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Axios, TanStack React Query, React Hook Form, Zod, React Icons.

> **Status: source complete, NOT yet installed, type-checked, built, or run against the live API.**
> The environment this code was written in had no network access, so `npm install`, `tsc`, `vite build`,
> and every live API call were impossible. Only a syntax parse and a check that all local imports and named
> exports resolve were run. Expect to fix some type errors and some schema mismatches on first run.

## Requirements

- Node.js **20.19 or newer** (22 LTS recommended; required by Vite 7)
- npm 10+

## Setup

```bash
npm install
cp .env.example .env.local      # optional; defaults to the official API URL
npm run typecheck               # tsc -p tsconfig.app.json --noEmit
npm run dev                     # http://localhost:5173
npm run build                   # tsc -b && vite build
npm run preview                 # serve the production build
```

No ESLint config or `lint` script is included. `react-helmet-async` (^2.0.5, declares React 19 support) is the only
added dependency. Versions in `package.json` are caret ranges chosen without registry access;
if `npm install` reports a peer-dependency conflict, align the versions it names.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `https://route-posts.routemisr.com` | API base URL (no trailing slash) |

If the browser blocks API calls with a CORS error, set `VITE_API_BASE_URL=/api-proxy` in `.env.local`
and restart `npm run dev`; the Vite dev server then proxies to the API. This proxy exists only in dev.

## Features (all use real API requests)

Registration, login, session restore on refresh, `ProtectedRoute`/`PublicRoute`, 401 handling; home feed
(All / Following) with infinite scroll; post composer with image preview; edit own post; like, bookmark,
share (backend share, not the browser share sheet); who-liked dialog; post details with comments,
comment image attachments, replies, edit/delete/like comments; own profile with photo upload, own posts
(`only=me`), change password; notifications with unread count, mark one/all read; suggested users (display only);
partial public profiles for other users at `/users/:userId` (see below).

### Post details without a single-post endpoint
The API has no `GET /posts/:postId`. The page resolves a post from (1) router state passed by the link
(survives a refresh in the same tab), (2) cached feed pages, (3) a bounded scan of the first pages of
`/posts/feed` and `/posts`. If none finds it, a clear fallback links back to the home feed.

### Post menu and deleting posts
Your own posts have a three-dot menu (Edit post / Delete post) that closes on outside press, Escape, or selection.
Delete opens a confirmation dialog, then sends `DELETE /posts/:postId` through the shared Axios instance (Bearer token
attached; the post id is always appended, and a bare `/posts/` is never sent). The API returns no body, so any 2xx
response counts as success. While the request runs the dialog shows a spinner and blocks repeat submissions. Only after
the server confirms does the app close the dialog, show "Post deleted", and remove the post from every cached feed
(all, following, me), post list, author/user list and details query (the details page then returns to the feed). On
failure the post stays, and a toast explains why (403: not your post; 404: not found; otherwise the server message).

> The path `/posts/:postId` comes from your report of the Postman docs plus the API's own conventions (`PUT
> /posts/:postId`, comment delete). The public docs page does not list it and it has not been tested against the live API.

### Offline handling
`NetworkGate` (wrapping the router) uses TanStack Query's `onlineManager`, which follows the browser's `online` /
`offline` events (seeded from `navigator.onLine` at startup). It never reacts to a single failed request, so server
errors keep their normal error screens.
- Offline with nothing cached to show (a mounted query is paused with no data): full-screen "You're offline" page over
  the still-mounted app, so auth state and cached data are untouched.
- Offline on a screen with cached data: a small "You're offline" indicator; content stays usable.
- **Retry** probes `/api/health` once (any HTTP response counts as reachable), then resumes paused queries and
  refetches errored ones once. Coming back online also recovers automatically. There are no retry loops.
- Mutations use `networkMode: 'always'`: attempted offline, they fail immediately with an error toast rather than
  being queued, so nothing is reported as done while offline. No service worker is used.

### Follow system, follower lists, and profile details

**Evidence level matters here.** The official endpoint table (25 endpoints) has no follow, follower-list, user-profile,
or user-posts endpoint, and the Postman docs could not be rendered in the environment this was written in. Three
independent projects built on this API document `PUT /users/:id/follow` (toggle), `GET /users/:id/profile`, and
`GET /users/:id/posts`. These are used here but are **unverified against the live API**; response shapes are
assumptions (marked in `src/api/users.api.ts` and `src/api/normalizers.ts`). No endpoint for follower/following *lists*
was found anywhere.

- **Follow / Following button** (`FollowButton`): shown beside post authors, in suggestions, the likes dialog,
  follower/following lists, and profile headers; never for yourself. It is a toggle request, so it appears only when the
  current state is known (from your own profile's `following` array, or an `isFollowing` flag on the user). If your
  profile payload has neither, no button is shown rather than guessing. Nothing changes locally until the server
  confirms; duplicate clicks are blocked across all buttons for the same user; on success the profile, suggestions,
  and "following" feed are refetched. Comments do not get a button (kept uncluttered).
- **Followers / Following lists** (`UserListModal`): no list endpoint was found anywhere, so lists come from the
  profile payload. Populated user objects are shown directly. If the payload has only ids, each id is resolved through
  `GET /users/:id/profile` (unverified), 10 at a time with "Load more", with loading, empty, and error states;
  unresolvable ids are counted, never invented. Counts alone (no users or ids) leave the stat as plain text with a
  note. Your own Following list is built from your `following` ids, so it updates after a follow/unfollow. Suggested
  users are never used to fill these lists.
- **Profile details** (`ProfileInfo`, on `/profile` and `/users/:id`): name, username, age (calculated from the real
  date of birth and today's date), gender, email, date of birth, joined date, bio, and counts. A row is
  shown only if the API supplied a value; "Joined" uses the API's creation timestamp, never the current date.
  Field names (`gender`, `dateOfBirth`, `createdAt`, `postsCount`/`posts`) are assumptions. For other users these
  details appear only when that user's own `GET /users/:id/profile` response includes them; they are never taken from
  cached copies, and the page says when the API doesn't provide them.
- **Other users' profiles** try `GET /users/:id/profile` and `GET /users/:id/posts` first. A 404 falls back to the
  partial mode below, and the header says which mode is active (full / partial / loading).
- **Avatars** link to the right profile in posts, shared-post previews, comments, replies, likes, follower lists,
  suggestions, notifications, and the composer.

### Public profiles when the profile endpoints are unavailable (partial)
The official docs list no endpoint for fetching another user's profile or posts (re-checked; the 25 endpoints are
unchanged). `/users/:userId` therefore does **not** call a profile API. It is built only from data the documented
endpoints already return:

- **User info:** the user object passed through router state when you click an author, merged with the most complete
  copy found in cached posts, comments, likes, and suggestions. Photo, name, username, bio, and followers/following are
  shown only if the API included them in those objects. The page is always labelled "Partial profile".
- **Posts:** a bounded client-side search of `GET /posts/feed?only=all` (5 pages x 20 posts), keeping posts whose author id
  matches. These are real posts, but not the user's full history; the UI says how many feed posts were searched.
- **Direct URL / refresh:** router state survives a refresh in the same tab. Without it the page falls back to the
  cache and feed search, and shows "Profile unavailable" with a link back to the feed when the user is not found.
- Your own id redirects to `/profile`. Authors in post cards, top comments, comments, replies, the likes dialog, and
  suggestions link to the profile (own entries link to `/profile`). The shared-post preview and notification rows are
  already links to a post, so their author names are not separate links.

### Profile, Settings, themes, search, links, titles
- **Profile** (`/profile`): cover banner, avatar with a working camera button (uploads immediately through the same
  mutation Settings uses, spinner while uploading), details, and tabs **All** (your posts incl. shares, `feed?only=me`),
  **Shared** (those of your posts that reference an original post; never a relabelled copy of All) and **Bookmarks**
  (`GET /users/bookmarks`, unverified, 404 shows "not available").
- **Settings** (`/settings`, in the main navigation): Theme, Profile photo, Cover photo (switched off until its API is
  connected), Change password (moved here from Profile).
- **Theme**: Light / Dark / System via one `ThemeProvider`; colour tokens flip on `<html class="dark">`, saved in
  `localStorage` (`route-social.theme`, a genuine client preference), System follows `prefers-color-scheme` live, and an
  inline script in `index.html` applies it before first paint.
- **Home people panel**: Suggested | Search tabs. There is no user-search endpoint, so Search matches name/username among
  suggested people and authors already loaded in posts; the UI says so.
- **Copy link**: every post's menu copies `<origin>/posts/<id>` (Clipboard API, `execCommand` fallback). Opening it
  when signed out goes to Login/Register keeping `state.from`, and returns to that post afterwards; refresh keeps it.
  The post is resolved from cache, then `GET /posts/:id` (unverified), then a small list scan; deleted/invalid ids show "Post not found".
- **Login / Register**: animated gradient backdrop, staggered entrance, brand panel (lg+), show/hide password
  (`PasswordField`, also in Change password). All motion is CSS and disabled under `prefers-reduced-motion`.
- **Page titles**: `react-helmet-async` (`PageTitle`), `<Page> | Social Media App`. Bookmarks is a Profile tab, not a route.
- **Unread badge**: real `GET /notifications/unread-count`, shown as `9+` beyond 9, refreshed after mark-read / mark-all.

### Cover photos, image viewer, suggestions paging
- **Cover photos**: Settings uploads a chosen image (with preview) to `PUT /users/upload-cover` as `multipart/form-data` through the shared
  Axios instance (Bearer token, no manual Content-Type). The cover is then read from the profile data (`user.cover`), so it shows
  on your profile and, via `/users/:id/profile`, on others', and survives a reload *if the profile payload contains it*.
  **Unconfirmed**: the multipart field name (`COVER_FIELD = 'cover'` in `src/api/users.api.ts`) and the response/profile key
  for the URL (`cover` / `coverPhoto` / `coverImage` / `banner`, read in `api/normalizers.ts`). If the server answers with a field-name
  error, change `COVER_FIELD`. If a cover uploads but doesn't show, the app says so; check the response in the Network tab and
  fix the key in `normalizers.ts`.
- **Image viewer** (`ImageLightbox` / `ImageViewerButton`): profile photos and covers on your profile and on other users'
  profiles open full-screen (dark overlay, aspect ratio kept, close button, Escape, outside click; clicks inside never
  reach links behind it). Avatars in the feed, comments and suggestions still link to the profile, so the viewer is only
  offered where the picture is not already a navigation link (the profile pages).
- **Suggested paging** (`PaginationBar`): Previous · page number · Next under the Suggested tab, calling
  `GET /users/suggestions?page=&limit=` with the page in the query key (each page cached; the previous page stays dimmed
  while the next loads). Next appears only when the response says there is a next page (`meta` next/total pages when
  present, otherwise a full page implies more), so the last page can occasionally be empty. Search is unaffected, and the page
  survives switching tabs.
- **Search paging**: the same `PaginationBar`, but **not backed by a search API**: none exists, so there is no server query,
  endpoint or pagination parameter to use (and no search query keys to cache). The matches found among already-known
  people (suggestions and authors in loaded posts) are split into pages of 6 on the client. The page resets to 1 whenever
  the query changes, is clamped to the available pages, and is independent of the Suggested page.

### Confirmation dialogs
One reusable `ConfirmDialog` (on the shared native-`<dialog>` `Dialog`, role `alertdialog`) guards every destructive or
important action; nothing runs until its confirm button is pressed (Cancel, Escape and the backdrop only close it):
- **Logout** (sidebar, mobile top bar, session-error screen) via `useLogoutConfirm`: "Confirm Logout" / "Log Out".
- **Delete post**: "Delete Post?"; **Delete comment** / **Delete reply**: "Delete Comment?" / "Delete Reply?" (the comment
  mutation is bound to the post id and comment id, so it can never delete the post); **Unfollow**: "Unfollow User?" with
  the real `@username` (falls back to the name). Following is not confirmed.
- While a request runs, both buttons lock and Escape, the backdrop and the X are ignored. Deletions leave the caches and
  unfollow updates the UI only after the server confirms. On failure the dialog stays open with the error inline (a modal
  covers toasts), so nothing is reported as done; success closes the dialog and shows a toast. Logout is a local action
  (clears the token and cache, then the route guards redirect to `/login`), so it has no loading state.

### Design system and layout (neon violet + electric cyan)
- **Identity** (`src/index.css`): the default theme is a premium dark UI (midnight navy `#070914`, cards `#0f1226`, a faint violet/cyan ambient light behind
  everything) with **neon violet** (`brand-from`, text/focus/indicators) and **electric cyan** (`brand-to`, glows, gradients). Light mode
  keeps the same identity on lilac-white; System follows the device. New visitors start in dark; Settings -> Theme still offers
  Light / Dark / System.
- **Tokens**: `canvas surface ink muted line soft` plus `brand-*`, `like` (heart pink), `badge`, `rounded-card` 18px, layered `shadow-card`.
  Filled controls use `bg-brand-gradient` (violet to blue, AA contrast with white text); `shadow-glow`, `accent-line`, `bg-accent-ring` and
  `text-brand-gradient` are used selectively for active/primary elements only.
- **Avatars** have a violet-to-cyan ring (with a soft glow from `lg` up); post cards lift slightly and their border glows on hover
  (pointer devices, no lift under reduced motion); the Like action is a heart with a pop animation.
- **Shell**: glass `AppHeader` (app name, people search, primary nav with unread badge, account menu), left shortcuts and the
  "Suggested for you" rail on wide screens, and a fixed glass bottom bar on phones with a glowing sliding indicator (active state is
  also a bar and bold label, not colour alone). No stories feature or other new API was added.
- The earlier layout, behaviour, API calls, query keys and confirmation dialogs are unchanged by the redesign.

### Cover photo integration (where things live)
- Axios instance: `src/api/axiosInstance.ts`. Upload function `uploadCoverPhoto` and `COVER_FIELD`: `src/api/users.api.ts`.
- Mutation `useUploadCover` (refetches the profile, invalidates your cached public profile): `src/hooks/useProfile.ts`.
- Settings UI: `src/components/profile/CoverPhotoSection.tsx`. Display: `UserCover.tsx` -> `ProfileCover.tsx` (own profile page and `PublicProfileHeader.tsx`).
- Earlier cover-post experiment: removed. If you used it, those posts still exist on the server as ordinary posts whose text is
  `[[route-social:cover:v1]]`; nothing was deleted automatically, so delete them with the post menu if you want them gone.

### Creating posts
`POST /posts` is sent as `multipart/form-data` and only includes fields that have content: `body` when there is text, `image` when a
file is attached. The server rejects an empty `body`, so image-only posts send just `image`; a post with neither is refused
(client-side and in `createPost`). No placeholder text is ever sent.

### Animations
No animation library was added (Framer Motion is not a dependency, and CSS covers everything here with `transform` and `opacity`).
The system lives in `src/index.css` ("Motion system") and is reused through utilities and small components:
- **Auth**: drifting gradient blobs and particles (hidden on phones), staggered form entrance, slide/fade between Login and Register,
  animated focus ring, real spinner on submit, cross-fading show/hide-password icon.
- **Feed and posts**: `Reveal` fade-up with a capped stagger (max 6 x 40ms), only when an item mounts, so infinite-scroll batches fade in
  and existing posts never re-animate; hover shadow on cards; like "pop", bookmark bounce (only after a click), share/comment icon nudges.
- **Navigation**: header hover pill and active underline slide between items; bottom-bar indicator slides; page fade-up keyed by path
  only; unread badge pops when the count changes; Profile/Home tab underline slides and panels fade.
- **Profile and Settings**: staggered reveal of header, name/stats and tabs, hover zoom on cover and avatar (still click-to-enlarge),
  success ring on the avatar after a photo upload.
- **Overlays and feedback**: dialogs, confirm dialogs and the image viewer scale + fade in *and out* (`Dialog` / `ImageLightbox`
  `data-closing`); dropdowns pop in; toasts slide in/out and success toasts draw a check; skeletons use a calm shimmer; every
  button has a press state; theme changes cross-fade colours briefly (never at startup).
- **Accessibility/performance**: `prefers-reduced-motion` disables all movement and looping (the particles are removed), durations are
  shorter on phones, and no logic, request, route or cache behaviour was changed.

## Not implemented (not supported by the documented API)

A cover-photo endpoint (not provided yet), a user-search service, follower/following list endpoints, stories, mark-unread/delete
notification. Reply edit/delete/like is also omitted because the docs only describe those endpoints for comments.

## Known API assumptions (verify on first run)

Each is marked `ASSUMPTION` in the source; fix it only in the file listed.

| Area | Assumption | File |
|---|---|---|
| Saved posts | `GET /users/bookmarks`; entries are posts or `{ post }`; next page only if `meta` says so | `api/posts.api.ts` |
| Single post | `GET /posts/:id`, data is the post or `{ post }`; 400/404/422 = not found | `api/posts.api.ts` |
| Cover photo | no endpoint; optional `cover` / `coverPhoto` / `coverImage` / `banner` on the user | `api/normalizers.ts` |
| Follow | `PUT /users/:id/follow` toggles follow state (third-party documented, unverified) | `api/users.api.ts` |
| Other profile / posts | `GET /users/:id/profile`, `GET /users/:id/posts` (third-party documented, unverified; 404 = unsupported) | `api/users.api.ts` |
| Follow state | own `following` array (ids or users) or `isFollowing` flag; `followers` / `following` arrays | `api/normalizers.ts` |
| Profile details | `gender`, `dateOfBirth`, `createdAt`, `postsCount` / `posts` | `api/normalizers.ts` |
| Signup body | `name, username, email, password, rePassword, dateOfBirth, gender` | `api/auth.api.ts`, `schemas/auth.schema.ts` |
| Signin body | `email` if the input contains `@`, otherwise `username`, plus `password` | `api/auth.api.ts` |
| Auth response | `data.token`; user at `data.user` (optional) | `api/auth.api.ts` |
| Change password | body `password`, `newPassword`; rotated token at `data.token` | `api/auth.api.ts` |
| Profile photo | multipart field `photo` | `api/users.api.ts` |
| Remove post image | form field `removeImage=true` | `api/posts.api.ts` |
| Share | optional JSON `body` caption | `api/posts.api.ts` |
| Comment text | field `content` (multipart on create, JSON on edit) | `api/comments.api.ts` |
| Image rules | JPEG/PNG/WebP/GIF, 5 MB (client-side only) | `utils/image.ts` |
| Response shapes | author/photo/like/bookmark/comment-count key names; several are accepted | `api/normalizers.ts` |
| Pagination | `meta.nextPage` / `hasNextPage` / current+total pages; else a full page means more | `api/normalizers.ts` |
| Notifications | actor, type, post/comment ids, read flag key names | `api/normalizers.ts` |

If lists render empty or fields are missing, open the browser Network tab, compare the real JSON to
`src/api/normalizers.ts`, and adjust the key names there.

## Security note

The token is kept in `localStorage` (`route-posts.token`). Any script on the page can read it, so an XSS
flaw would expose the session. The API offers bearer tokens only (no httpOnly cookies). Avoid rendering
unsanitised HTML, and treat this as acceptable for a learning project, not for production.

## Structure

`src/api` (Axios instance, services, normalizers) · `src/hooks` (React Query hooks, query keys, cache helpers) ·
`src/components/{common,layout,post,comment,profile}` · `src/context` (auth, toast) · `src/layouts` ·
`src/pages` (incl. `UserProfile`) · `src/routes` · `src/schemas` (Zod) · `src/types` · `src/utils`.
