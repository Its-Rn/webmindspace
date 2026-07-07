# Fixes applied

Drop these files into your project at the same relative paths (they overwrite the originals). No new dependencies are needed — everything uses packages already in your `package.json`.

## 1. "New task" not reflected like blog/timeline

**Root cause:** every other create action (blog post, timeline post, note, chat message) increments a counter on the user's `stats` object (`blogsPublished`, `timelinePosts`, `notesCreated`, `messagesSent`), which the Dashboard reads to update its widgets and momentum score. Creating a task only ever touched `stats.tasksCompleted`, and only when the task was later marked *completed* — never on creation. So the Dashboard (and its "Delivery" momentum score) never moved when you clicked "Create task"; it looked like the task wasn't added at all, even though it was saved to the database and showed up fine on the Tasks page itself.

**Fix:**
- `server/src/models/User.js` — added a `stats.tasksCreated` field.
- `server/src/services/task.service.js` — increment `stats.tasksCreated` on create, decrement it on delete (mirrors how blog/timeline handle delete).
- `server/src/services/dashboard.service.js` — expose `tasksCreated` in the dashboard payload and fold it into the "Delivery" momentum score.
- `client/src/pages/DashboardPage.jsx` — the "Tasks completed" widget is now "Tasks", showing the created count with completed count as the subtitle, so it updates the instant you create a task (the Tasks page already invalidates the `dashboard` query on create, so no other client change was needed there).

## 2. Live chat

Two real bugs, plus a completeness gap:

- **Crash bug:** `ChatPage.jsx`'s socket `useEffect` had `token` in its dependency array, but `token` was never defined anywhere in the component. That's a `ReferenceError` on every render of the effect, which breaks the live-update wiring. Removed it.
- **Messages weren't actually live:** sending a message went through the REST endpoint (`POST /chat/conversations/:id/messages`), which saved to the DB but never emitted anything over Socket.IO. Only the *Socket.IO* `chat:message` event path (used nowhere in the UI) did that. So the recipient never got your message pushed to them in real time — they'd only see it after the 30s conversations poll, and only if they reopened the conversation. Fixed by having the REST controller (`server/src/controllers/chat.controller.js`) broadcast the saved message over the socket too, to both the conversation room and each participant's personal room.
- **Completeness:** added live broadcast for read receipts (`chat:read`) and message deletion (`chat:messageDeleted`), and had the client listen for `chat:new` (fires for any conversation, not just the one you have open) so the sidebar's unread badges and last-message previews update instantly instead of waiting for the poll.

## 3. Live notifications

Notifications were created in the database (e.g. "new message from X") but never pushed anywhere — the bell icon in the top bar didn't even have a click handler or a badge, and the Notifications page only found out about new items via a 30-second poll.

**Fix:**
- `server/src/services/notification.service.js` now emits a `notification:new` socket event to the recipient the moment a notification is created.
- Added `client/src/services/socket.js`: one shared Socket.IO connection used by both chat and notifications (previously chat had its own private one). Disconnected on logout (`UserMenu.jsx`).
- `client/src/layouts/PrivateLayout.jsx`: the bell icon now shows a live unread-count badge, is clickable (goes to `/notifications`), and pops a toast the instant a new notification arrives.
- `client/src/pages/notifications/NotificationsPage.jsx`: listens for the same live event and keeps the unread-count badge in sync when you mark things read/unread/delete.

---

**Note on testing:** I reviewed and traced all of this by reading the code end-to-end (including checking response shapes between client/server and testing the Socket.IO circular-import path in isolation), but I wasn't able to spin up MongoDB in this sandbox to click through the UI myself. Please test locally with `npm run dev` before deploying — in particular the task-create → dashboard update flow and two browser tabs logged in as different users for chat.
