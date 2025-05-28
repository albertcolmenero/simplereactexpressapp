# 🚀 Secure Todo App with PostgreSQL & Clerk Authentication

A production-ready full-stack todo application built with React (TypeScript), Express.js, PostgreSQL, Prisma ORM, and Clerk authentication.

## ✨ Features

- 🔐 **Secure Authentication** with Clerk (email, social logins, passwordless)
- 👤 **User-specific Todos** - Each user sees only their own todos
- 🗄️ **PostgreSQL Database** with Prisma ORM for robust data persistence
- 🛡️ **JWT Token Verification** on the backend for secure API access
- ✅ **Full CRUD Operations** (Create, Read, Update, Delete)
- 📊 **Real-time Statistics** and progress tracking
- 🎨 **Modern Glassmorphism UI** with responsive design
- ⚡ **Optimistic Updates** for smooth user experience
- 🔄 **Automatic User Creation** on first login
- 📱 **Mobile-friendly** responsive design
- 🚀 **Production-ready** architecture

## 🛠 Tech Stack

**Frontend:**
- React 19 with TypeScript
- Clerk React SDK for authentication
- Axios for HTTP requests with JWT tokens
- Modern CSS with glassmorphism design
- Responsive mobile-first design

**Backend:**
- Express.js with async/await
- Prisma ORM for database operations
- PostgreSQL for data persistence
- Clerk Node SDK for JWT verification
- CORS enabled for cross-origin requests

**Database:**
- PostgreSQL with proper relationships
- User table linked to Clerk authentication
- Todo table with user associations
- Prisma migrations for schema management

**Authentication & Security:**
- Clerk for complete user management
- JWT token verification on all protected routes
- User-scoped data access
- Secure password handling (handled by Clerk)

## 🏁 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (local or cloud)
- A Clerk account (free at [clerk.com](https://clerk.com))

### 📦 Installation

#### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend and backend dependencies
npm run install-all
```

#### 2. Set up PostgreSQL Database

You can use a local PostgreSQL installation or a cloud service like:
- [Neon](https://neon.tech) (recommended for development)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql)

#### 3. Configure Database Connection

1. **Update `backend/.env`** with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name?schema=public"
```

Replace with your actual database credentials.

#### 4. Set up Clerk Authentication

1. **Create a Clerk Application:**
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create a new application
   - Choose your preferred authentication methods (email, Google, GitHub, etc.)

2. **Get your API Keys:**
   - In the Clerk Dashboard, go to "API Keys"
   - Copy your **Publishable Key** and **Secret Key**

3. **Configure Environment Variables:**

   **Frontend (`frontend/.env`):**
   ```env
   REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
   ```

   **Backend (`backend/.env`):**
   ```env
   CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
   ```

#### 5. Set up Database Schema

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Seed some data
npx prisma db seed
```

### 🚀 Running the Application

#### Start both servers simultaneously (Recommended)

```bash
npm run dev
```

This will start:
- **Backend server** on http://localhost:3001
- **Frontend development server** on http://localhost:3000

#### Alternative: Run servers separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### 🎯 Using the Application

1. **Access the App:**
   - Open your browser and go to http://localhost:3000

2. **First Time Setup:**
   - Click "Sign In / Sign Up" to create your account
   - Choose your preferred authentication method
   - Complete the registration process

3. **Managing Todos:**
   - Add new todos with the input field
   - Click on todo text (or emoji) to toggle completion
   - Use the delete button to remove todos
   - View your progress with real-time statistics

4. **User Account:**
   - Click your profile picture to access account settings
   - Update profile, change authentication methods, or sign out
   - Your todos are private and linked to your account

## 🗄️ Database Schema

```sql
-- Users table (managed by Prisma)
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  clerkId     TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  firstName   TEXT,
  lastName    TEXT,
  imageUrl    TEXT,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);

-- Todos table (user-specific)
CREATE TABLE todos (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);
```

## 🔧 API Endpoints

All API endpoints require authentication via Clerk JWT tokens.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API info | ❌ |
| GET | `/api/health` | Health check | ❌ |
| GET | `/api/todos` | Get user's todos | ✅ |
| GET | `/api/todos/:id` | Get specific todo | ✅ |
| POST | `/api/todos` | Create new todo | ✅ |
| PUT | `/api/todos/:id` | Update todo | ✅ |
| DELETE | `/api/todos/:id` | Delete todo | ✅ |

### Example API Usage

```javascript
// Frontend automatically includes JWT token in requests
const response = await authenticatedApi.post('/api/todos', {
  text: 'Learn Prisma ORM'
});
```

## 📁 Project Structure

```
simple-react-express-app/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main component with auth
│   │   ├── App.css              # Enhanced styles
│   │   ├── index.tsx            # Entry point with ClerkProvider
│   │   └── ...
│   ├── .env                     # Clerk publishable key
│   ├── package.json
│   └── ...
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── server.js                # Express server with auth
│   ├── .env                     # Database URL & Clerk secret
│   ├── package.json
│   └── ...
├── package.json                 # Root scripts
└── README.md
```

## 🔐 Authentication Flow

1. **User signs in** via Clerk on the frontend
2. **Frontend receives JWT token** from Clerk
3. **All API requests** include the JWT token in Authorization header
4. **Backend verifies token** using Clerk's Node SDK
5. **User is created/retrieved** from PostgreSQL database
6. **API response** includes only user-specific data

## 🛠 Development

### Database Operations

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (careful in production!)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

### Environment Variables Summary

**Frontend `.env`:**
```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Backend `.env**:
```env
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY=sk_test_...
```

## 🚀 Deployment

### Backend Deployment (Railway/Heroku/Vercel)

1. Set environment variables in your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Generate Prisma client: `npx prisma generate`

### Frontend Deployment (Vercel/Netlify)

1. Set `REACT_APP_CLERK_PUBLISHABLE_KEY` environment variable
2. Build: `npm run build`
3. Deploy the `build` folder

## 🔍 Troubleshooting

### Common Issues

1. **"Missing Publishable Key" error:**
   - Ensure `REACT_APP_CLERK_PUBLISHABLE_KEY` is set in `frontend/.env`
   - Restart development server after changing env vars

2. **Database connection errors:**
   - Verify your `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check firewall/network settings

3. **Authentication not working:**
   - Verify Clerk secret key is correct
   - Check JWT token is being sent in requests
   - Ensure Clerk application settings match your domain

4. **Prisma errors:**
   - Run `npx prisma generate` after schema changes
   - Use `npx prisma db push` for development
   - Use `npx prisma migrate dev` for production-ready migrations

### Development Tips

- Use **Prisma Studio** (`npx prisma studio`) to view/edit database data
- Check **browser console** for frontend errors
- Check **server logs** for backend errors
- Use **Clerk Dashboard** to monitor user activity
- Enable **detailed logging** in development

## 📈 Next Steps

To enhance this application further:

1. **Advanced Features:**
   - Todo categories and tags
   - Due dates and reminders
   - Collaborative todos with sharing
   - File attachments
   - Rich text editing

2. **Performance Optimizations:**
   - Redis caching for frequent queries
   - Database connection pooling
   - CDN for static assets
   - Lazy loading for large todo lists

3. **DevOps & Monitoring:**
   - CI/CD pipeline setup
   - Error tracking (Sentry)
   - Performance monitoring
   - Automated database backups

4. **Mobile App:**
   - React Native version
   - Offline synchronization
   - Push notifications

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications!

---

## 🆘 Support

If you run into issues:

1. Check this README for common solutions
2. Review the [Clerk documentation](https://clerk.com/docs)
3. Check [Prisma documentation](https://www.prisma.io/docs)
4. Open an issue in this repository

Built with ❤️ using modern web technologies. # simplereactexpressapp
