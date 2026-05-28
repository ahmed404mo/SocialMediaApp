# Social Application Backend API

A robust, scalable backend REST & GraphQL API for a social media and real-time chat application. Built with **Node.js, Express.js, TypeScript, MongoDB, Redis, and Socket.io**.

## 🚀 Key Features

- **Authentication & Authorization:** Secure JWT-based authentication with Access and Refresh tokens.
- **Session Management:** Redis integration for token blacklisting (revocation) and Socket.io session tracking.
- **User Management:** Profiles, friendships, and account deletion.
- **Social Features:** Create posts, comment on posts, and interact with user-generated content.
- **Real-Time Chat System:**
  - **One-to-One Chat (OVO):** Private messaging between friends.
  - **Group Chat (OVM):** Create groups, upload group avatars, and broadcast messages.
  - Powered by **Socket.io** with custom authentication middleware.
- **Media Management:** Automatic image uploads and cleanup via **Cloudinary**.
- **GraphQL Support:** Dedicated `/graphql` endpoint for flexible querying.
- **Error Handling:** Centralized global error handling with custom Exception classes.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (with Mongoose)
- **Caching & Pub/Sub:** Redis
- **Real-Time:** Socket.io
- **Media Storage:** Cloudinary
- **API Paradigm:** REST APIs & GraphQL

## 📂 Project Structure

```text
src/
├── common/         # Enums, interfaces, exceptions, utils, types, and generic services (Token, Redis)
├── config/         # Environment variables and configurations
├── DB/             # Database connection, Mongoose models, repositories, and Cloudinary config
├── middleware/     # Global error handlers, Authentication middlewares, etc.
├── modules/        # Domain-driven features (Auth, User, Post, Comment, Chat, Realtime)
├── app.bootstrap.ts# Application express and socket.io bootstrap setup
└── main.ts         # Main entry point
```

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js** (v16+ recommended)
- **MongoDB** instance (Local or Atlas)
- **Redis** instance (Local or Cloud)
- **Cloudinary** Account (for image uploads)

## 🚀 Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd applicated
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` or `.env.development` file in the root directory and add the following:

   ```env
   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # Database URLs
   DB_URI=mongodb://localhost:27017/your_db_name
   REDIS_URL=redis://127.0.0.1:6379

   # JWT Secrets
   USER_TOKEN_SECRET_KEY=your_access_token_secret
   USER_REFRESH_TOKEN_SECRET_KEY=your_refresh_token_secret
   System_TOKEN_SECRET_KEY=your_admin_access_secret
   System_REFRESH_TOKEN_SECRET_KEY=your_admin_refresh_secret

   # Expirations
   ACCESS_EXPIRES_IN=15m
   REFRESH_EXPIRES_IN=7d

   # Cloudinary Keys
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run the Application:**
   - **Development Mode** (with hot-reload):
     ```bash
     npm run dev
     ```
   - **Build for Production:**
     ```bash
     npm run build
     ```
   - **Start Production Server:**
     ```bash
     npm start
     ```

## 📡 API Overview

- **`GET /`** - Landing page
- **`/graphql`** - GraphQL endpoint for structured querying
- **`/auth`** - Login, Registration, Token Rotation
- **`/user`** - Profiles, friend management, Logout (ALL / Current Session)
- **`/post`** - Feed, post creation and deletion
- **`/:postId/comment`** - Nested comments logic
- **`/chat`** - REST endpoints for chat initialization (OVO, OVM) and paginated messages

_Real-time events are strictly handled over `/` namespace using `socket.io` events like `sayHi`, `connection`, `disconnect`, etc._
