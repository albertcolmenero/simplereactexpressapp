const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('./generated/prisma');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Initialize Clerk
const clerk = createClerkClient({
  secretKey: process.env.CLERK_JWT_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify Clerk authentication
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authentication token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔐 Verifying token for user...');
    
    const payload = await clerk.verifyToken(token);
    
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('👤 User authenticated with Clerk ID:', payload.sub);

    // Get or create user in our database
    const clerkUser = await clerk.users.getUser(payload.sub);
    let user = await prisma.user.findUnique({
      where: { clerkId: payload.sub }
    });

    if (!user) {
      console.log('🆕 Creating new user in database for Clerk ID:', payload.sub);
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          clerkId: payload.sub,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        }
      });
    } else {
      console.log('✅ Found existing user in database:', user.id);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Simple React-Express API with SQLite and Clerk!',
    database: 'Connected to SQLite via Prisma',
    auth: 'Protected by Clerk'
  });
});

// Get all todos for the authenticated user
app.get('/api/todos', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching todos for user:', req.user.id);
    
    const todos = await prisma.todo.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 Found ${todos.length} todos for user ${req.user.id}`);

    // Transform to match frontend expectations (convert id to number)
    const transformedTodos = todos.map(todo => ({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36), // Create a numeric ID from string
      text: todo.text,
      completed: todo.completed,
      realId: todo.id // Keep the real ID for database operations
    }));

    res.json(transformedTodos);
  } catch (error) {
    console.error('❌ Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get a specific todo
app.get('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find by either numeric ID or real string ID
    const todos = await prisma.todo.findMany({
      where: {
        userId: req.user.id
      }
    });

    const todo = todos.find(t => 
      t.id === id || 
      parseInt(t.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36),
      text: todo.text,
      completed: todo.completed,
      realId: todo.id
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// Create a new todo
app.post('/api/todos', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const todo = await prisma.todo.create({
      data: {
        text: text.trim(),
        userId: req.user.id
      }
    });

    res.status(201).json({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36),
      text: todo.text,
      completed: todo.completed,
      realId: todo.id
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update a todo
app.put('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    // Find the todo first
    const todos = await prisma.todo.findMany({
      where: {
        userId: req.user.id
      }
    });

    const existingTodo = todos.find(t => 
      t.id === id || 
      parseInt(t.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;

    const updatedTodo = await prisma.todo.update({
      where: {
        id: existingTodo.id
      },
      data: updateData
    });

    res.json({
      id: parseInt(updatedTodo.id.split('').slice(-6).join(''), 36),
      text: updatedTodo.text,
      completed: updatedTodo.completed,
      realId: updatedTodo.id
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
app.delete('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the todo first
    const todos = await prisma.todo.findMany({
      where: {
        userId: req.user.id
      }
    });

    const todo = todos.find(t => 
      t.id === id || 
      parseInt(t.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.todo.delete({
      where: {
        id: todo.id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// ========================================
// PROJECT ROUTES
// ========================================

// Get all projects for the authenticated user
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    console.log('📂 Fetching projects for user:', req.user.id);
    
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        todos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📁 Found ${projects.length} projects for user ${req.user.id}`);

    // Transform to match frontend expectations
    const transformedProjects = projects.map(project => ({
      id: parseInt(project.id.split('').slice(-6).join(''), 36),
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.createdAt,
      todoCount: project.todos.length,
      completedCount: project.todos.filter(t => t.completed).length,
      realId: project.id // Keep the real ID for database operations
    }));

    res.json(transformedProjects);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get a specific project with its todos
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📂 Fetching project:', id, 'for user:', req.user.id);
    
    // Find by either numeric ID or real string ID
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        todos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    const project = projects.find(p => 
      p.id === id || 
      parseInt(p.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Transform todos
    const transformedTodos = project.todos.map(todo => ({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36),
      text: todo.text,
      completed: todo.completed,
      createdAt: todo.createdAt,
      realId: todo.id
    }));

    res.json({
      id: parseInt(project.id.split('').slice(-6).join(''), 36),
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.createdAt,
      todos: transformedTodos,
      realId: project.id
    });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create a new project
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    console.log('📁 Creating new project:', name, 'for user:', req.user.id);

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6', // Default blue color
        userId: req.user.id
      }
    });

    res.status(201).json({
      id: parseInt(project.id.split('').slice(-6).join(''), 36),
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.createdAt,
      todoCount: 0,
      completedCount: 0,
      realId: project.id
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Find the project first
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      }
    });

    const existingProject = projects.find(p => 
      p.id === id || 
      parseInt(p.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;

    console.log('📝 Updating project:', existingProject.id);

    const updatedProject = await prisma.project.update({
      where: {
        id: existingProject.id
      },
      data: updateData,
      include: {
        todos: true
      }
    });

    res.json({
      id: parseInt(updatedProject.id.split('').slice(-6).join(''), 36),
      name: updatedProject.name,
      description: updatedProject.description,
      color: updatedProject.color,
      createdAt: updatedProject.createdAt,
      todoCount: updatedProject.todos.length,
      completedCount: updatedProject.todos.filter(t => t.completed).length,
      realId: updatedProject.id
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the project first
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      }
    });

    const project = projects.find(p => 
      p.id === id || 
      parseInt(p.id.split('').slice(-6).join(''), 36) === parseInt(id)
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('🗑️ Deleting project:', project.id);

    await prisma.project.delete({
      where: {
        id: project.id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get todos for a specific project
app.get('/api/projects/:projectId/todos', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('📝 Fetching todos for project:', projectId);
    
    // Find the project first to ensure it belongs to the user
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      }
    });

    const project = projects.find(p => 
      p.id === projectId || 
      parseInt(p.id.split('').slice(-6).join(''), 36) === parseInt(projectId)
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const todos = await prisma.todo.findMany({
      where: {
        projectId: project.id,
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 Found ${todos.length} todos for project ${project.id}`);

    const transformedTodos = todos.map(todo => ({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36),
      text: todo.text,
      completed: todo.completed,
      projectId: parseInt(project.id.split('').slice(-6).join(''), 36),
      createdAt: todo.createdAt,
      realId: todo.id
    }));

    res.json(transformedTodos);
  } catch (error) {
    console.error('❌ Error fetching project todos:', error);
    res.status(500).json({ error: 'Failed to fetch project todos' });
  }
});

// Create a todo in a specific project
app.post('/api/projects/:projectId/todos', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Find the project first to ensure it belongs to the user
    const projects = await prisma.project.findMany({
      where: {
        userId: req.user.id
      }
    });

    const project = projects.find(p => 
      p.id === projectId || 
      parseInt(p.id.split('').slice(-6).join(''), 36) === parseInt(projectId)
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('📝 Creating todo in project:', project.id);

    const todo = await prisma.todo.create({
      data: {
        text: text.trim(),
        userId: req.user.id,
        projectId: project.id
      }
    });

    res.status(201).json({
      id: parseInt(todo.id.split('').slice(-6).join(''), 36),
      text: todo.text,
      completed: todo.completed,
      projectId: parseInt(project.id.split('').slice(-6).join(''), 36),
      createdAt: todo.createdAt,
      realId: todo.id
    });
  } catch (error) {
    console.error('❌ Error creating project todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Database: Connected to PostgreSQL via Prisma`);
  console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`Authentication: Protected by Clerk`);
}); 