# Bondly

**Connect. Share. Bond.**

Bondly is a modern, full-stack social media platform where users can register, create posts with text and images, browse a public feed, like and comment on posts — all in real time without page reloads.

---

## Features

- **Authentication** — Signup, Login, JWT-protected routes
- **Create Posts** — Text only, image only, or both
- **Image Uploads** — With preview, type validation, and 5MB limit
- **Public Feed** — Newest-first, paginated
- **Likes** — Toggle like/unlike with instant UI updates
- **Comments** — Add and view comments in real time
- **Delete Posts** — Authors can remove their own posts
- **Responsive UI** — Clean dark theme, works on desktop, tablet, and mobile
- **Security** — Hashed passwords, JWT auth, server-side validation

---

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | React, React Router, Axios |
| Backend   | Node.js, Express.js       |
| Database  | MongoDB, Mongoose         |
| Auth      | JWT, bcryptjs             |
| Uploads   | Multer                    |
| Styling   | Vanilla CSS (no Tailwind) |

---

## Requirements

- **Node.js** v18 or higher
- **MongoDB** running locally or a MongoDB Atlas URI
- **npm** v9 or higher

---

## Installation

```bash
git clone <repository-url>
cd bondly
```

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
```

---

## Environment Variables

Create a `server/.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bondly
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

| Variable     | Description                         |
|------------- |-------------------------------------|
| `PORT`       | Server port (default: 5000)         |
| `MONGO_URI`  | MongoDB connection string           |
| `JWT_SECRET` | Secret key for signing JWT tokens   |
| `CLIENT_URL` | Frontend URL for CORS configuration |

---

## Running the Application

### Start the backend

```bash
cd server
npm run dev
```

### Start the frontend (in a separate terminal)

```bash
cd client
npm run dev
```

The frontend runs at **http://localhost:5173** and the backend at **http://localhost:5000**.

---

## API Documentation

### Auth

| Method | Endpoint          | Auth | Description          |
|--------|-------------------|------|----------------------|
| POST   | `/api/auth/signup` | No   | Register a new user  |
| POST   | `/api/auth/login`  | No   | Login and get JWT    |
| GET    | `/api/auth/me`     | Yes  | Get current user     |

### Posts

| Method | Endpoint                      | Auth | Description           |
|--------|-------------------------------|------|-----------------------|
| GET    | `/api/posts?page=1&limit=10`  | No   | Get paginated feed    |
| POST   | `/api/posts`                  | Yes  | Create a new post     |
| DELETE | `/api/posts/:postId`          | Yes  | Delete own post       |
| POST   | `/api/posts/:postId/like`     | Yes  | Toggle like/unlike    |
| POST   | `/api/posts/:postId/comments` | Yes  | Add a comment         |

---

## Database

Bondly uses **only two MongoDB collections**:

1. **`users`** — User accounts
2. **`posts`** — Posts with embedded likes and comments arrays

No separate collections for likes, comments, followers, or anything else.

---

## Project Structure

```
bondly/
├── client/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context (AuthContext)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Root with routing
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   └── package.json
├── server/
│   ├── controllers/       # Route handlers
│   ├── middleware/         # Auth middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── utils/             # Multer config
│   ├── uploads/           # Uploaded images
│   ├── server.js          # Express entry point
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## License

MIT
