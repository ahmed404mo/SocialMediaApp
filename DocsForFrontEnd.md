# 📖 Social App - Frontend Integration Guide

This document is intended for Frontend Developers. It outlines the overall execution plan and provides a detailed guide on how to integrate the frontend with the Backend (REST APIs, GraphQL, and Socket.io).

---

## 🚀 Execution Plan

To ensure a smooth integration process, it is highly recommended to implement the features in the following order:

### Phase 1: Authentication

1. **Register & Login:** Create the UI for user registration and login. Upon successful login, you will receive an `access_token` and a `refresh_token`.
2. **Store Tokens:** Safely store these tokens in `localStorage` or `Cookies`.
3. **Axios Interceptor Setup:**
   - Attach the `access_token` to the `Authorization` header (Format: `Bearer <access_token>`) for all protected requests.
   - Implement a fallback mechanism: If a request fails with a `401/403` error (expired token), automatically call the Refresh Token endpoint using the `refresh_token`, update the stored tokens locally, and retry the original request.

### Phase 2: Real-Time Connection (Socket.io)

1. Initialize the Socket.io connection immediately after a successful login or when the app loads with an authenticated user.
2. **Socket Auth:** You **MUST** pass the `access_token` inside the connection options (`auth.authorization` or `headers.authorization`).
3. Listen for global events like connection status updates (`offline_user`, error events, etc.).

### Phase 3: Social Features

1. Fetch the User Profile.
2. Display the Posts (Feed) using the REST API or GraphQL endpoint.
3. Implement interactions such as creating posts, deleting posts, and adding comments.

### Phase 4: Chat System

1. Implement One-to-One (OVO) messaging interfaces.
2. Implement Group Chat (OVM) creation interfaces (which includes uploading a group avatar).
3. Use the REST APIs to fetch chat history (Pagination) and use Socket.io to send/receive live messages.

---

## 🌐 REST API Endpoints Overview

**Base URL:** `https://backend-social-media-app-livid.vercel.app/`

> **⚠️ Important:** All endpoints below (except Register and Login) require the following header:
> `Authorization: Bearer <access_token>`

### 1. Authentication

- **`POST /auth/register`**
  - **Description:** Creates a new user account.
  - **Body (JSON):** User registration details (e.g., `userName`, `email`, `password`, `gender`, etc.).

- **`POST /auth/login`**
  - **Description:** Authenticates a user and starts a session.
  - **Body (JSON):** `{ "email": "user@example.com", "password": "yourpassword" }`
  - **Response:** Returns the user object along with `access_token` and `refresh_token`.

- **`POST /auth/refresh`** _(verify exact route in backend router)_
  - **Description:** Rotates/Refreshes the access token.
  - **Headers:** Needs the `refresh_token` passed as a Bearer token.

### 2. User Profile

- **`GET /user/profile`**
  - **Description:** Retrieves the current authenticated user's profile and their associated groups.

- **`POST /user/logout`**
  - **Description:** Logs the user out and revokes their active token.
  - **Body (JSON):**
    - `{ "flag": "CURRENT" }` to logout from the current device only.
    - `{ "flag": "ALL" }` to logout from all active devices.

- **`DELETE /user/delete`**
  - **Description:** Permanently deletes the user account and cleans up their Cloudinary assets.

### 3. Posts & Comments

- **`GET /post`**
  - **Description:** Fetches the post feed.
  - **Query Params:** `?page=1&size=10` (Pagination is required).

- **`POST /post`**
  - **Description:** Creates a new post.
  - **Body (FormData):** Pass `content` (string) and an optional image `file`.

- **`DELETE /post/:postId`**
  - **Description:** Deletes a specific post.
  - **Params:** `postId` in the URL.

- **`POST /:postId/comment`**
  - **Description:** Adds a comment to a specific post.
  - **Params:** `postId` in the URL.
  - **Body (FormData/JSON):** Comment content and optional attachments.

### 4. Chat System

- **`GET /chat/:participantId`**
  - **Description:** Fetches chat history with a specific friend (One-to-One).
  - **Params:** `participantId` (The friend's User ID).
  - **Query Params:** `?page=1&size=20` (Fetches the latest 20 messages).

- **`GET /chat/group/:groupId`**
  - **Description:** Fetches chat history for a specific group.
  - **Params:** `groupId` (The Group's Object ID).
  - **Query Params:** `?page=1&size=20`

- **`POST /chat/group`**
  - **Description:** Creates a new group chat.
  - **Body (FormData):** This endpoint requires `multipart/form-data` because it accepts an image file.
    - `participantsIds[]`: Array of user IDs to add to the group. _(Append to FormData multiple times for each user)_.
    - `group`: Name of the group.
    - `file`: The group avatar image (Optional).

---

## ⚡ Real-Time Socket.io Integration

**Prerequisite:** Install the client library in your frontend project.

```bash
npm install socket.io-client
```

### 1. Connection Initialization

You **MUST** pass the authorization token when connecting. If not, the server will reject the connection.

```javascript
import { io } from "socket.io-client";

const socket = io("https://backend-social-media-app-livid.vercel.app/", {
  auth: {
    authorization: `Bearer ${localStorage.getItem("access_token")}`, // Essential for auth
  },
});
```

### 2. Listening to Events (Server -> Client)

Update your UI when the server broadcasts these events:

```javascript
// Triggered if authentication fails or token is missing
socket.on("custom_error", (errorMessage) => {
  console.error("Socket Error:", errorMessage);
});

// Triggered when a user disconnects/goes offline
socket.on("offline_user", (data) => {
  console.log("User went offline:", data.userId);
  // Example: Update the green dot next to the user's name to gray
});

// Note: Add chat-specific events (like 'receiveMessage') based on your chat gateway logic.
```

### 3. Emitting Events (Client -> Server)

Send events to the server for real-time actions:

```javascript
// Test the connection
socket.emit("sayHi", { message: "Hello from the frontend!" });

// Example of sending a message (adjust event name and payload based on your chat gateway)
// socket.emit("sendMessage", { sendTo: "USER_ID", content: "Hello there!" });
```

---

## 📊 GraphQL API

For flexible and customized data fetching, a GraphQL endpoint is available.

- **URL:** `[POST] /graphql`
- **Headers:** `Authorization: Bearer <access_token>`
- **Usage:** Send your standard GraphQL queries and mutations in the request body.

---

## 🛠️ Important Notes for Frontend

1. **File Uploads (FormData):** Whenever an endpoint expects a `file` (like creating a post with an image, or creating a group chat), you must send the request body as `FormData` (not JSON). The `Content-Type` header should be automatically set to `multipart/form-data` by Axios when passing a `FormData` object.
2. **Pagination:** For feeds and chat histories, always utilize the `page` and `size` query parameters to prevent fetching massive amounts of data at once. This improves app performance.
3. **Error Handling:** Backend errors return a structured JSON response containing `message` and `statusCode`. Always read `error.response.data.message` in your Axios `catch` block to display user-friendly toast notifications.
