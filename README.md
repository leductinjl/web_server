# Anime Learning Platform Backend

This is the backend server for the Anime Learning Platform, built with Node.js, Express, and TypeScript.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Redis (for caching)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web_server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env` file:
- Set up your database connection
- Configure Redis connection
- Set up JWT secret
- Configure email service (if needed)

## Database Setup

1. Create your PostgreSQL database

2. Run database migrations:
```bash
npm run migrate:latest
```

## Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server in development mode with hot-reload enabled.

### Production Mode
1. Build the TypeScript files:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript files
- `npm start` - Start production server
- `npm run migrate:make` - Create new migration
- `npm run migrate:latest` - Run latest migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run migrate:status` - Check migration status

## Project Structure

```
src/
├── controllers/    # Request handlers
├── middlewares/    # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.ts       # Server entry point
```

## API Documentation

API documentation is available at `/docs` when the server is running.

## License

ISC 