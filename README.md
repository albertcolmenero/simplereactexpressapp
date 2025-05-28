# 🚀 Project Todo Manager with PostgreSQL & Clerk Authentication

A production-ready full-stack project management application built with React (TypeScript), Express.js, PostgreSQL, Prisma ORM, and Clerk authentication. Organize your todos into projects with custom colors and track progress efficiently.

## ✨ Features

### 🔐 **Authentication & Security**
- **Secure Authentication** with Clerk (email, social logins, passwordless)
- **JWT Token Verification** on the backend for secure API access
- **User-specific Data** - Each user sees only their own projects and todos
- **Session Management** with automatic token refresh

### 📁 **Project Management**
- **Create Projects** with custom names, descriptions, and colors
- **Project Organization** - Group related todos together
- **Visual Project Selection** with color-coded indicators
- **Project Statistics** - View todo count and completion progress
- **Project Deletion** with confirmation and cascade delete of todos

### ✅ **Todo Management**
- **Project-specific Todos** - Add todos to specific projects
- **Cross-project View** - See all todos across projects
- **Full CRUD Operations** (Create, Read, Update, Delete)
- **Real-time Statistics** and progress tracking
- **Optimistic Updates** for smooth user experience

### 🎨 **User Interface**
- **Modern Glassmorphism UI** with gradient backgrounds
- **Responsive Design** - Works perfectly on desktop and mobile
- **Color-coded Projects** for easy visual identification
- **Intuitive Project Switching** and management
- **Real-time Progress Tracking** per project

### 🗄️ **Database & Performance**
- **PostgreSQL Database** with Prisma ORM for robust data persistence
- **Efficient Relationships** between users, projects, and todos
- **Database Migrations** for schema management
- **Connection Pooling** and optimization

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
- Project table with user associations
- Todo table with user and project relationships
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

#### 1. Clone the Repository

```bash
git clone https://github.com/albertcolmenero/simplereactexpressapp.git
cd simplereactexpressapp
```

#### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend and backend dependencies
npm run install-all
```

#### 3. Set up PostgreSQL Database

You can use a local PostgreSQL installation or a cloud service like:
- [Neon](https://neon.tech) (recommended for development)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Heroku Postgres](https://elements.heroku.com/addons/heroku-postgresql)

#### 4. Configure Backend Environment

Create `backend/.env` file:

```env
# PostgreSQL Database URL
# Replace with your actual database connection string
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Clerk JWT Key (Secret Key)
# Get this from your Clerk Dashboard: https://dashboard.clerk.com -> API Keys
# This should start with sk_test_ or sk_live_
CLERK_JWT_KEY="sk_test_your_clerk_secret_key_here"
```

#### 5. Configure Frontend Environment

Create `frontend/.env` file:

```env
# Clerk Publishable Key
# Get this from your Clerk Dashboard: https://dashboard.clerk.com -> API Keys
# This should start with pk_test_ or pk_live_
REACT_APP_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_publishable_key_here"
```

#### 6. Set up Clerk Authentication

1. **Create a Clerk Application:**
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Create a new application
   - Choose your preferred authentication methods (email, Google, GitHub, etc.)

2. **Get your API Keys:**
   - In the Clerk Dashboard, go to "API Keys"
   - Copy your **Publishable Key** and **Secret Key**
   - Add them to the respective `.env` files

#### 7. Set up Database Schema

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npx prisma db push

# Generate Prisma client
npx prisma generate
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

3. **Managing Projects:**
   - Click "+ New Project" to create a project
   - Choose a name, description, and color for your project
   - Click on projects to switch between them
   - Use the delete button (🗑️) to remove projects

4. **Managing Todos:**
   - Select a project or use "All Todos" view
   - Add todos using the input field
   - Click on todo text (or emoji) to toggle completion
   - Use the delete button to remove todos
   - View progress with real-time statistics

5. **Project Organization:**
   - Create different projects for different areas of your life
   - Use colors to visually organize your projects
   - Track completion progress for each project
   - Switch between projects seamlessly

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

-- Projects table
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);

-- Todos table (user and project relationships)
CREATE TABLE todos (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  userId      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  projectId   TEXT REFERENCES projects(id) ON DELETE CASCADE,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);
```

## 🔧 API Endpoints

All API endpoints require authentication via Clerk JWT tokens except health check.

### **Project Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | Get user's projects | ✅ |
| GET | `/api/projects/:id` | Get specific project with todos | ✅ |
| POST | `/api/projects` | Create new project | ✅ |
| PUT | `/api/projects/:id` | Update project | ✅ |
| DELETE | `/api/projects/:id` | Delete project | ✅ |
| GET | `/api/projects/:id/todos` | Get todos for specific project | ✅ |
| POST | `/api/projects/:id/todos` | Create todo in specific project | ✅ |

### **Todo Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/todos` | Get user's todos (all projects) | ✅ |
| GET | `/api/todos/:id` | Get specific todo | ✅ |
| POST | `/api/todos` | Create new todo (general) | ✅ |
| PUT | `/api/todos/:id` | Update todo | ✅ |
| DELETE | `/api/todos/:id` | Delete todo | ✅ |

### **System Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API info | ❌ |
| GET | `/api/health` | Health check with database status | ❌ |

## 📁 Project Structure

```
simplereactexpressapp/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main component with project management
│   │   ├── App.css              # Enhanced styles with project UI
│   │   ├── index.tsx            # Entry point with ClerkProvider
│   │   └── ...
│   ├── .env                     # Clerk publishable key
│   ├── package.json
│   └── ...
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema with projects
│   ├── server.js                # Express server with project routes
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
6. **API response** includes only user-specific data (projects and todos)

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
CLERK_JWT_KEY=sk_test_...
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
   - Verify Clerk JWT key is correct (should start with `sk_test_`)
   - Check JWT token is being sent in requests
   - Ensure Clerk application settings match your domain

4. **Project creation failing:**
   - Check backend server is running on port 3001
   - Verify authentication token is valid
   - Check database connection and schema

### Development Tips

- Use **Prisma Studio** (`npx prisma studio`) to view/edit database data
- Check **browser console** for frontend errors
- Check **server logs** for backend errors
- Use **Clerk Dashboard** to monitor user activity
- Enable **detailed logging** in development

## 📈 Next Steps

To enhance this application further:

1. **Advanced Project Features:**
   - Project templates and categories
   - Project collaboration and sharing
   - Project deadlines and reminders
   - Project archiving

2. **Enhanced Todo Management:**
   - Todo priorities and labels
   - Due dates and reminders
   - Subtasks and dependencies
   - File attachments

3. **Analytics & Reporting:**
   - Productivity analytics
   - Time tracking
   - Progress reports
   - Export capabilities

4. **Performance & Scale:**
   - Redis caching for frequent queries
   - Database connection pooling
   - CDN for static assets
   - Real-time updates with WebSockets

5. **Mobile Experience:**
   - React Native mobile app
   - Offline synchronization
   - Push notifications
   - Progressive Web App (PWA)

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications!

## 🆘 Support

If you run into issues:

1. Check this README for common solutions
2. Review the [Clerk documentation](https://clerk.com/docs)
3. Check [Prisma documentation](https://www.prisma.io/docs)
4. Open an issue in this repository

---

Built with ❤️ using modern web technologies. Perfect for learning full-stack development, project management, and secure authentication patterns.
