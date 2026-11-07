# QueueFlow – Queue Management System

QueueFlow is a full-stack queue management application that helps managers organize queues, manage customer tokens and monitor queue performance through an analytics dashboard.

## Features

- **Manager Authentication:** Secure manager login using JWT authentication.
- **Queue Management:** Create and manage multiple queues.
- **Token Generation:** Add people to queues and automatically generate token numbers.
- **Waiting Queue:** View all waiting tokens in their current order.
- **Queue Reordering:** Move tokens up or down in the waiting queue.
- **Token Serving:** Call the next waiting token for service.
- **Token Cancellation:** Cancel waiting tokens when required.
- **Analytics Dashboard:** Monitor queue statistics, average waiting time, average service time and queue-length trends.

## Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Project Structure

```text
QueueFlow/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```


## 📸 Application Screenshots

### 1. Manager Login
![QueueFlow Login](screenshots/login.png)

### 2. Manager Registration
![QueueFlow Sign Up](screenshots/signup.png)

### 3. Dashboard
![QueueFlow Dashboard](screenshots/dashboard.png)

### 4. Queue Management
![QueueFlow Queue Details](screenshots/queue-details.png)

### 5. Analytics Dashboard
![QueueFlow Analytics](screenshots/analytics.png)


## Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rajalaxmeparida/QueueFlow.git
cd QueueFlow
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the placeholder values with your own MongoDB connection string and a secure JWT secret.

Start the backend:

```bash
npm run dev
```

The backend will run on:

`http://localhost:5000`

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide a local URL, usually:

`http://localhost:5173`

Open the URL in your browser to use QueueFlow.

## API Overview

| Method | Endpoint                               | Description                |
| ------ | -------------------------------------- | -------------------------- |
| POST   | `/api/auth/login`                      | Manager login              |
| POST   | `/api/queues`                          | Create a queue             |
| GET    | `/api/queues`                          | Retrieve queues            |
| POST   | `/api/tokens`                          | Add a token                |
| GET    | `/api/tokens/queue/:queueId`           | Get waiting tokens         |
| PATCH  | `/api/tokens/:tokenId/move`            | Reorder a token            |
| PATCH  | `/api/tokens/:tokenId/cancel`          | Cancel a token             |
| PATCH  | `/api/tokens/queue/:queueId/call-next` | Call the next token        |
| PATCH  | `/api/tokens/:tokenId/serve`           | Mark a token as served     |
| GET    | `/api/analytics/overview`              | Overall analytics          |
| GET    | `/api/analytics/queue/:queueId`        | Individual queue analytics |

Protected endpoints require a valid JWT access token in the Authorization header.

## Token Statuses

Tokens can have the following statuses:

- `WAITING` – Waiting for service.
- `SERVING` – Currently being served.
- `SERVED` – Service completed.
- `CANCELLED` – Token cancelled.

## Analytics

The analytics dashboard provides insights into:

- Total and active queues.
- Total tokens.
- Waiting, serving, served and cancelled tokens.
- Average waiting time.
- Average service time.
- Daily queue-length trends.

## Security

- Manager authentication using JSON Web Tokens.
- Protected API routes.
- Environment variables for sensitive configuration.
- `.env` files excluded through `.gitignore`.

**Important:** Never upload your actual `.env` file, database credentials or JWT secret to GitHub.

## Future Improvements

- Real-time queue updates.
- Customer-facing token tracking.
- Notifications when a token is approaching service.
- Advanced analytics and reporting.

## Author

Developed as a full-stack queue management project using React, Node.js, Express and MongoDB.
