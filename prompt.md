# Frontend Generation Prompt

_Copy everything below the line and paste it into an advanced AI (like Claude 3.5 Sonnet or ChatGPT-4o) to generate your complete Frontend application._

---

**Role:**
You are an Expert Principal Frontend Engineer. Your task is to build a highly scalable, fully responsive, and production-ready Frontend application for a Social Media & Real-Time Chat platform.

**Tech Stack Required:**

- **Framework:** React.js (or Next.js App Router if preferred)
- **Language:** Strict TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand (for global state like Auth and Socket connection)
- **Data Fetching:** Axios (with Interceptors) + React Query (@tanstack/react-query)
- **Real-Time:** socket.io-client
- **Routing:** React Router v6 (or Next.js native routing)
- **Forms:** React Hook Form + Zod validation
- **Notifications:** react-hot-toast (for success/error messages)

---

### 🌍 1. Backend Architecture & Configuration

**Base URL:** `https://backend-social-media-app-livid.vercel.app/`

**API Rules:**

1. All requests (except Login/Signup/Forgot Password) MUST include the header: `Authorization: Bearer <access_token>`.
2. **Axios Interceptor (CRITICAL):** Implement an Axios interceptor. If any request fails with a `401/403` status, automatically pause the request, call `POST /user/rotate-token` (passing the `refresh_token` in headers), update local tokens, and retry the original failed request.
3. **FormData:** Any endpoint that requires file uploads (Creating Posts, Creating Group Chats, Updating Profile/Cover pictures) MUST be sent as `multipart/form-data`.
4. **Error Handling:** Backend returns errors in the format: `{ message: string, statusCode: number, error: any }`. Catch these globally and show a toast notification with the `message`.

---

### 🔐 2. Features & Endpoints to Implement

#### A. Authentication Module (`/auth`)

- **Signup:** `POST /auth/signup` (Body: `username`, `email`, `password`, `confirmPassword`, optional `phone`).
- **Login:** `POST /auth/login` (Body: `email`, `password`). Returns `{ access_token, refresh_token }`. Save these securely.
- **Forgot Password Flow:**
  - `POST /auth/request-forgot-password-code` (email)
  - `PATCH /auth/verify-forgot-password-code` (email, otp)
  - `PATCH /auth/reset-forgot-password-code` (email, otp, password, confirmPassword)

#### B. User Profile Module (`/user`)

- **Get Profile:** `GET /user` (Returns User object + Groups array).
- **Get Other User Profile:** `GET /user/:userId` (Returns User object + Groups array for specific user).
- **Logout:** `POST /user/logout` (Body: `{ flag: "CURRENT" | "ALL" }`).
- **Update Profile Picture:** `PATCH /user/profile-picture` (FormData: `file`).
- **Update Cover Picture:** `PATCH /user/cover-picture` (FormData: `files` array).
- **Delete Account:** `DELETE /user`.

#### C. Social Feed & Posts (`/post`)

- **Feed List:** `GET /post?page=1&size=10`. Implement Infinite Scrolling using React Query.
- **Create Post:** `POST /post` (FormData: `content`, `attachments` up to 2 files, `tags[]` userIds, `availability`).
- **React to Post:** `PATCH /post/:postId/react?react=1` (1 for like, 0 for dislike).
- **Create Comment:** `POST /:postId/comment` (FormData: `content`, `attachments`).
- **Reply to Comment:** `POST /:commentId/reply` (FormData).

#### D. Chat System (`/chat` & Socket.io)

- **Fetch OVO Chat:** `GET /chat/:participantId?page=1&size=20`.
- **Fetch Group Chat:** `GET /chat/group/:groupId?page=1&size=20`.
- **Create Group:** `POST /chat/group` (FormData: `participantsIds[]`, `group` name, `file` image).

---

### ⚡ 3. Real-Time Socket.io Implementation

Create a global custom hook (e.g., `useSocket`) initialized upon successful login.

**Connection:**

```typescript
const socket = io("https://backend-social-media-app-livid.vercel.app/", {
  auth: { authorization: `Bearer ${access_token}` },
});
```

**Socket Events to Listen For (Server -> Client):**

- `custom_error`: Show toast error.
- `offline_user`: Update UI to show user as offline (`{ userId }`).
- `newMessage`: Append incoming message to chat state (`{ content, from/groupId }`).
- `successMessage`: Confirm message was sent.
- `likePost`: Update post like count live (`{ postId, userId, react }`).

**Socket Events to Emit (Client -> Server):**

- `sayHi`: `{ name: string }`
- `sendMessage`: `{ sendTo: string, content: string }`
- `sendGroupMessage`: `{ groupId: string, content: string }`
- `joinRoom`: `{ roomId: string }`

---

### 📂 4. Expected Output & Structure

Please generate the code iteratively in manageable chunks to avoid token limits. Start by giving me the initial project setup and directory structure. Then, provide the code for:

1. **API Client & Interceptors** (`src/lib/axios.ts`).
2. **State Management** (`src/store/useAuthStore.ts`).
3. **Socket Provider/Hook** (`src/providers/SocketProvider.tsx`).
4. **Authentication Pages** (Login & Register Components).
5. **User Profile Pages** (Dynamic page to view own profile and other users' profiles by ID).
6. **Social Feed Components** (Post list, Create Post Form with file upload).
7. **Chat Interface** (Real-time message list, active conversations).

Ensure all code is clean, DRY, strictly typed, and includes loading skeletons/spinners for async actions.
