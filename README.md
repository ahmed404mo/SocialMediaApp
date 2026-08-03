<p align="center">
  <img src="https://nodejs.org/static/images/logo.svg" width="100" alt="Node.js Logo" />
</p>

<h1 align="center">Social Media Application — Backend API</h1>

<p align="center">
  A robust, scalable <strong>Social Media &amp; Real-Time Chat backend</strong>.
  <br />
  REST + GraphQL · Socket.IO realtime · Redis sessions · Cloudinary media.
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-v5-3178c6?logo=typescript&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" />
  <img alt="Redis" src="https://img.shields.io/badge/Redis-v5-FF4438?logo=redis&logoColor=white" />
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socketdotio&logoColor=white" />
  <img alt="GraphQL" src="https://img.shields.io/badge/GraphQL-graphql--http-E10098?logo=graphql&logoColor=white" />
  <img alt="Cloudinary" src="https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary&logoColor=white" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [REST API Reference](#rest-api-reference)
- [GraphQL API](#graphql-api)
- [Real-time Events](#real-time-events)
- [Security](#security)
- [Data Model](#data-model)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

A complete backend for a **social media platform with real-time chat**, exposing **REST** and **GraphQL** APIs. It powers user profiles & friendships, posts with nested comments, one-to-one (`OVO`) and group (`OVM`) chat over **Socket.IO**, Redis-backed session/token management, and Cloudinary-powered media — all protected by a hardened JWT authentication layer.

---

## Features

### Authentication & Authorization 🔐
- **JWT dual-token** system — access + refresh tokens with separate secrets for **user** and **system (admin)** roles
- **Token rotation** (`/user/rotate-token`) & **logout** (all sessions or current session)
- **Email confirmation** via OTP (Nodemailer) + **resend** endpoint
- **Google OAuth2** signup/login (`google-auth-library`)
- **Password recovery** flow — request code → verify code → reset password
- RBAC via `authorization` middleware + per-endpoint permission maps

### User Management 👤
- Profile view (self / by id), profile & cover picture upload (single / multi → Cloudinary)
- **Friendship** model (`friends[]`), account soft-delete
- Password hashing (bcrypt) & **AES-256 field-level encryption** (phone)

### Social Feed 📰
- **Posts** with content + up to 2 attachments, availability control (`PUBLIC` / …)
- **Like & tag** interactions, paginated feed
- **Nested comments** — replies on comments, likes, tags, attachments

### Real-Time Chat 💬
- **One-to-One (OVO)** private chat between friends
- **Group chat (OVM)** — create groups with avatar upload, room-scoped broadcasts
- Messages support content, **attachments, likes and tags**
- **Redis socket registry** — track a user's sockets; broadcast `offline_user` when they disconnect completely
- JWT-authenticated socket connections (handshake auth or header)

### GraphQL 🧬
- Dedicated `/graphql` endpoint served by `graphql-http`, protected by the auth middleware
- Code-first SDL schema (`schema.gql.ts`) with resolvers for **users**, **posts** and pagination args

### Infrastructure 🛠️
- **Redis** — token blacklisting/revocation, socket registry, OTP storage
- **Cloudinary** — single/multi uploads with per-user folder layout & cleanup
- Centralized **global error handler** + custom `ApplicationException` / `DomainException` classes
- **Paranoid soft-delete** middleware on all models (`deletedAt` / `restoredAt`, `force` bypass)
- Validation via **Joi** schemas per route + shared pagination schema
- Unified **success response** wrapper

---

## Tech Stack

| Layer        | Technology                                            |
|--------------|-------------------------------------------------------|
| Runtime      | Node.js                                               |
| Framework    | Express.js 5                                          |
| Language     | TypeScript 5 (compiled with `tsc`)                    |
| Database     | MongoDB (Mongoose 9)                                  |
| Cache & State| Redis 5 (tokens, sockets, OTP)                        |
| Realtime     | Socket.IO 4 (server + client)                         |
| API          | REST + GraphQL (`graphql-http`)                       |
| Validation   | Joi, Zod                                              |
| Auth         | jsonwebtoken, bcrypt, google-auth-library             |
| Media        | Cloudinary + Multer                                   |
| Email        | Nodemailer                                            |
| Push         | firebase-admin (FCM)                                  |

---

## Architecture

A **domain-driven modular layout** over an Express app bootstrapped in `app.bootstrap.ts` — the same HTTP server hosts both the REST API and the Socket.IO gateway.

```
                        ┌───────────────────────────────────────────┐
REST clients ──────────►│  Express app (app.bootstrap.ts)            │
GraphQL clients ──────► │  ├── /auth · /user · /post · /:postId/comment
                        │  ├── /user/:userId/chat  (REST chat init)  │
                        │  ├── /graphql  (auth-protected)            │
                        │  └── global error handler                  │
Socket.IO clients ────► │  RealtimeGateway (JWT middleware)          │
                        │  ├── presence / Redis socket registry      │
                        │  └── OVO · OVM chat events                 │
                        └──────────────┬─────────────────────────────┘
                                       │
                      ┌────────────────┼────────────────────┐
                      ▼                ▼                    ▼
                    MongoDB        Redis               Cloudinary
                 (users/posts/   (tokens/sockets/      (media)
                  comments/chats)   OTP)
```

### Request Lifecycle

1. **Validation middleware** — Joi schema against body/params/query.
2. **Authentication middleware** — verifies JWT (access or refresh by type), attaches `req.user`.
3. **Authorization middleware** — checks `role` against the endpoint's allowed roles.
4. **Route handler / service / repository** — business logic over Mongoose.
5. **Success response wrapper** — consistent JSON envelope.
6. **Global error handler** — maps `ApplicationException` / `DomainException` to HTTP responses.

---

## Project Structure

```text
src/
├── app.bootstrap.ts           # Express + Socket.IO bootstrap (routing, GraphQL, error handler)
├── main.ts                    # Entry point
├── config/
│   └── config.ts              # dotenv-based environment access
├── common/
│   ├── enums/                 # chat · email · post · token · user enums
│   ├── exceptions/            # ApplicationException, DomainException
│   ├── interfaces/            # IUser, IPost, IComment, IChat, IMessage, pagination…
│   ├── response/              # successResponse wrapper
│   ├── services/              # Token, Redis, Security, Notification
│   ├── types/                 # express types (IAuthSoket, …)
│   ├── utils/                 # email, otp, objectId, post, security (hash/encrypt), upload
│   └── validation/            # general + pagination Joi schemas
├── DB/
│   ├── connection.db.ts       # Mongoose connection
│   ├── cloudinary/            # Cloudinary config
│   ├── model/                 # User · Post · Comment · Chat (paranoid middleware)
│   └── repository/            # Base + User/Post/Comment/Chat repositories
├── middleware/                # authentication · authorization · validation · error
└── modules/
    ├── auth/                  # login, signup, confirm-email, Gmail, forgot-password
    ├── user/                  # profile, pictures, logout, rotate-token (+ GraphQL)
    ├── post/                  # feed, create/update, react (+ GraphQL resolver)
    ├── comment/               # nested comments & replies
    ├── chat/                  # OVO/OVM REST + realtime events/gateway
    ├── realtime/              # RealtimeGateway (Socket.IO + JWT + Redis presence)
    └── graphql/               # SDL schema + context wiring
```

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **MongoDB** instance (local or Atlas)
- **Redis** instance (local or cloud)
- **Cloudinary** account (image uploads)
- Gmail app password (email OTP) — optional but recommended

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd <project-folder>

# 2. Install dependencies
npm install
```

### Environment Setup

Create `.env.development` (and optionally `.env.production`) in the root:

```bash
cp .env.example .env.development
```

> ⚠️ **Security note:** never commit real credentials. Use placeholders in the repo and keep the actual `.env.*` files local / in your secret store.

### Run

```bash
# Development (watch compile + hot restart)
npm run start:dev

# Build
npm run build

# Production
npm start
```

On success the server logs:

```
server is running on 3000 🚀
Application bootstrapped successfully✌️
```

---

## Environment Variables

| Variable                    | Description                                        | Example |
|-----------------------------|----------------------------------------------------|---------|
| `PORT`                      | HTTP server port                                   | `3000` |
| `NODE_ENV`                  | Runtime environment (selects `.env.<env>`)         | `development` |
| `DB_URI`                    | MongoDB connection string                          | `mongodb://localhost:27017/social` |
| `RUDIS_URI`                 | Redis connection string                            | `redis://127.0.0.1:6379` |
| `SALT_ROUND`                | bcrypt salt rounds                                 | `10` |
| `ENC_BYTE`                  | AES encryption byte size                           | `16` |
| `ENC_IV_LENGTH`             | AES IV length                                      | `16` |
| `USER_TOKEN_SECRET_KEY`     | JWT secret — user access tokens                    | `…` |
| `USER_REFRESH_TOKEN_SECRET_KEY` | JWT secret — user refresh tokens               | `…` |
| `System_TOKEN_SECRET_KEY`   | JWT secret — system/admin access tokens            | `…` |
| `System_REFRESH_TOKEN_SECRET_KEY` | JWT secret — system/admin refresh tokens       | `…` |
| `ACCESS_EXPIRES_IN`         | Access-token lifetime (seconds, default `1800`)    | `1800` |
| `REFRESH_EXPIRES_IN`        | Refresh-token lifetime (seconds, default `1800`)   | `1800` |
| `EMAIL_APP_PASSWORD`        | Gmail app password                                 | `…` |
| `EMAIL_APP`                 | Gmail sender address                               | `you@gmail.com` |
| `APPLICATION_NAME`          | Sender name in outgoing emails                     | `SocialApp` |
| `ORIGINS`                   | Comma-separated CORS origins                       | `http://localhost:3000` |
| `CLIENT_IDS`                | Google OAuth2 client IDs                           | `…apps.googleusercontent.com` |
| `CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary credentials                  | `…` |

---

## REST API Reference

> Base URL: `http://localhost:3000` · Authenticated routes require `Authorization: Bearer <token>`.

### Health

| Method | Endpoint | Description          |
|--------|----------|----------------------|
| GET    | `/`      | Landing page message |

### Authentication — `/auth`

| Method | Endpoint                           | Auth | Description                            |
|--------|------------------------------------|------|----------------------------------------|
| POST   | `/auth/signup`                     | —    | Register with email & password         |
| POST   | `/auth/login`                      | —    | Login → access + refresh tokens        |
| PATCH  | `/auth/confirm-email`              | —    | Confirm email with OTP                 |
| PATCH  | `/auth/resend-confirm-email`       | —    | Resend the confirmation OTP            |
| POST   | `/auth/signup/gmail`               | —    | Signup / login via Google ID token     |
| POST   | `/auth/request-forgot-password-code` | — | Request a password-reset code          |
| PATCH  | `/auth/verify-forgot-password-code` | —  | Verify the reset code                  |
| PATCH  | `/auth/reset-forgot-password-code`  | —  | Reset the password                     |

### User — `/user`

| Method | Endpoint               | Auth | Description                                    |
|--------|------------------------|------|------------------------------------------------|
| GET    | `/user`                | ✔    | Current user profile                           |
| GET    | `/user/:userId`        | ✔    | Get a profile by id                            |
| PATCH  | `/user/profile-picture`| ✔    | Upload profile picture (single file)           |
| PATCH  | `/user/cover-picture`  | ✔    | Upload cover pictures (multi file)             |
| DELETE | `/user/profile-picture`| ✔    | Remove profile picture                         |
| DELETE | `/user/cover-picture`  | ✔    | Remove a cover picture (by URL)                |
| POST   | `/user/logout`         | ✔    | Logout current / all sessions                 |
| POST   | `/user/rotate-token`   | ✔    | Refresh token rotation                        |
| DELETE | `/user`                | ✔    | Soft-delete account                            |

### Post — `/post`

| Method | Endpoint           | Auth | Description                                    |
|--------|--------------------|------|------------------------------------------------|
| GET    | `/post`            | ✔    | Paginated feed                                 |
| POST   | `/post`            | ✔    | Create post (up to 2 attachments)              |
| PATCH  | `/post/:postId`    | ✔    | Update a post                                  |
| PATCH  | `/post/:postId/react` | ✔ | Like / unlike a post                          |

### Comment — `/:postId/comment`

| Method | Endpoint                    | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | `/:postId/comment`          | ✔    | Comment on a post        |
| POST   | `/:postId/comment/:commentId/reply` | ✔ | Reply to a comment |

### Chat — `/user/:userId/chat`

| Method | Endpoint                    | Auth | Description                      |
|--------|-----------------------------|------|----------------------------------|
| GET    | `/user/:userId/chat`        | ✔    | One-to-one chat (paginated)      |
| GET    | `/user/:userId/chat/group`  | ✔    | Create a group (avatar upload)   |
| GET    | `/user/:userId/chat/group/:groupId` | ✔ | Group chat (paginated)      |

### Unified Response Format

```json
{
  "status": 200,
  "message": "Done",
  "data": {}
}
```

---

## GraphQL API

- **Endpoint:** `http://localhost:3000/graphql` (GET + POST)
- **Served by:** `graphql-http` (`createHandler`) mounted on Express
- **Auth:** every request passes the `authentication` middleware — the authenticated user is injected into the GraphQL context (`{ user, decoded }`)

Queries/fields are code-first SDL in `src/modules/graphql/schema.gql.ts`, with domain resolvers under `src/modules/{user,post}/gql/` (users, posts, pagination args).

---

## Real-time Events

Socket.IO on the root namespace (`/`), every connection authenticated with a **JWT access token** (from handshake `auth.authorization` or the `authorization` header).

| Event (in)         | Event (out)            | Description                                       |
|---------------------|------------------------|---------------------------------------------------|
| `sayHi`             | `sayHi`                | Liveness/echo handshake                           |
| `sendMessage`       | `newMessage`           | One-to-one message to the recipient's sockets     |
|                     | `successMessage`       | Confirmation to the sender                        |
| `sendGroupMessage`  | `newMessage`           | Group message broadcast to the room               |
|                     | `successMessage`       | Confirmation to the sender                        |
| `joinRoom`          | —                      | Socket joins a group room                         |
| `connection`        | —                      | Socket registered in the Redis registry           |
| `disconnect`        | `offline_user`         | Broadcast `{ userId }` when the last socket closes|
| (any error)         | `custom_error`         | Validation / service errors                       |

> Socket events are validated with the same Joi `soketValidation` layer used by the REST API.

---

## Security

- **Password hashing** — bcrypt with configurable `SALT_ROUND`.
- **Field-level encryption** — sensitive fields (e.g. `phone`) encrypted at rest with AES-256 (`generateEncryption`).
- **Dual-secret JWT** — user vs. system signatures and separate access/refresh secrets.
- **Token revocation** — revoked `jti`s live in Redis; rotating credentials invalidates older sessions.
- **Socket auth** — every connection verifies the JWT before the socket can emit.
- **Input validation** — Joi schemas for every route + socket event (whitelist behavior).
- **Paranoid deletes** — all models soft-delete (`deletedAt`/`restoredAt`) via Mongoose middleware; `force: true`/`paranoid: false` escapes exist.
- **Uploads** — Cloudinary remote storage with folder-per-user layout and cleanup.

---

## Data Model

### User (`SOCIAL_APP_USERS`)

| Field                   | Type            | Notes                                  |
|-------------------------|-----------------|----------------------------------------|
| `firstName` / `lastName`| String          | Required                               |
| `username`              | Virtual         | `firstName + lastName`, sets `slug`    |
| `email`                 | String          | Unique, required                       |
| `password`              | String          | Required for SYSTEM provider, hashed   |
| `phone`                 | String          | Optional, AES-256 encrypted at rest    |
| `profilePicture` / `profileCoverPicture` | String / String[] | Cloudinary URLs         |
| `friends`               | ObjectId[]      | ref `User`                             |
| `gender` / `role` / `provider` | Number (enum) | MALE/FEMALE · USER/ADMIN · SYSTEM/GOOGLE |
| `DOB` / `confirmEmail` / `changeCredentialsTime` | Date | Dates                |
| `deletedAt` / `restoredAt` | Date         | Soft-delete lifecycle                  |

### Post (`SOCIAL_APP_POSTS`)

| Field          | Type      | Notes                                   |
|----------------|-----------|-----------------------------------------|
| `folderId`     | String    | Required (Cloudinary folder)            |
| `content`      | String    | Required when no attachments            |
| `attachments`  | String[]  | Cloudinary URLs (max 2)                 |
| `availability` | Number    | enum — default `PUBLIC`                 |
| `likes` / `tags` | ObjectId[] | ref `User`                            |
| `createdBy` / `updatedBy` | ObjectId | ref `User`                    |
| `comments`     | Virtual   | ref `Comment`                           |

### Comment (`SOCIAL_APP_commentS`)

| Field         | Type      | Notes                                    |
|---------------|-----------|------------------------------------------|
| `content`     | String    | Required when no attachments             |
| `attachments` | String[]  | Cloudinary URLs                          |
| `likes` / `tags` | ObjectId[] | ref `User`                             |
| `postId`      | ObjectId[] | ref `Post` (required)                    |
| `commentId`   | ObjectId[] | ref `Comment` (for replies)              |
| `reply`       | Virtual   | Nested reply lookup                      |

### Chat (`SOCIAL_APP_CHATS`) & Message

| Field            | Type        | Notes                                    |
|------------------|-------------|------------------------------------------|
| `participants`   | ObjectId[]  | ref `User` (required)                    |
| `createdBy`      | ObjectId    | ref `User` (required)                    |
| `type`           | String      | enum `ovo` (one-to-one) / `ovm` (group)  |
| `group` / `roomId` | String   | Required when `ovm`                      |
| `group_image`    | String      | Cloudinary URL (group avatar)            |
| `messages[]`     | subdocument | `content` (or attachments), `attachments`, `likes`, `tags`, `createdBy` |

---

## Deployment

```bash
# Build the TypeScript bundle
npm run build

# Run the compiled output
npm start
```

**Vercel:** a `vercel.json` is included that builds `src/main.ts` with `@vercel/node` and routes all traffic to it — deployable straight from the repo.

> For full real-time (Socket.IO) support prefer a persistent Node host (VPS / Railway / Render / Fly.io); note that WebSocket connections do not survive on pure serverless functions.

---

## License

This project is licensed under the **ISC** license. See the `package.json` for details.
