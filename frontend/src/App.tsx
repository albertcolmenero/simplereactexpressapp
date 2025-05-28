import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { 
  SignInButton, 
  UserButton, 
  useUser,
  useAuth
} from '@clerk/clerk-react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  projectId?: number;
  createdAt?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  todoCount: number;
  completedCount: number;
  createdAt?: string;
}

const API_BASE_URL = 'http://localhost:3001';

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  const { user } = useUser();
  const { getToken } = useAuth();

  // Create axios instance with auth interceptor
  const createAuthenticatedRequest = async () => {
    const token = await getToken();
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  // Fetch projects and todos on component mount
  useEffect(() => {
    fetchProjects();
    fetchTodos(); // Still fetch general todos for backward compatibility
  }, []);

  const fetchProjects = async () => {
    try {
      const api = await createAuthenticatedRequest();
      const response = await api.get('/api/projects');
      setProjects(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to fetch projects.');
      }
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTodos = async (projectId?: number) => {
    try {
      setLoading(true);
      const api = await createAuthenticatedRequest();
      let response;
      
      if (projectId) {
        response = await api.get(`/api/projects/${projectId}/todos`);
      } else {
        response = await api.get('/api/todos');
      }
      
      setTodos(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to fetch todos.');
      }
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const api = await createAuthenticatedRequest();
      const response = await api.post('/api/projects', {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        color: newProjectColor
      });
      
      setProjects([response.data, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectColor('#3B82F6');
      setShowCreateProject(false);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to create project');
      }
      console.error('Error creating project:', err);
    }
  };

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      fetchTodos(project.id);
    } else {
      fetchTodos(); // Fetch general todos
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      const api = await createAuthenticatedRequest();
      let response;
      
      if (selectedProject) {
        response = await api.post(`/api/projects/${selectedProject.id}/todos`, {
          text: newTodoText.trim()
        });
      } else {
        response = await api.post('/api/todos', {
          text: newTodoText.trim()
        });
      }
      
      setTodos([response.data, ...todos]);
      setNewTodoText('');
      setError(null);
      
      // Refresh projects to update todo counts
      fetchProjects();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to add todo');
      }
      console.error('Error adding todo:', err);
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const api = await createAuthenticatedRequest();
      const response = await api.put(`/api/todos/${id}`, {
        ...todo,
        completed: !todo.completed
      });
      setTodos(todos.map(t => t.id === id ? response.data : t));
      setError(null);
      
      // Refresh projects to update completed counts
      fetchProjects();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to update todo');
      }
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const api = await createAuthenticatedRequest();
      await api.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
      setError(null);
      
      // Refresh projects to update todo counts
      fetchProjects();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to delete todo');
      }
      console.error('Error deleting todo:', err);
    }
  };

  const deleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure? This will delete the project and all its todos.')) {
      return;
    }

    try {
      const api = await createAuthenticatedRequest();
      await api.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
      
      // If we deleted the selected project, reset selection
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        fetchTodos();
      }
      
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
      } else {
        setError('Failed to delete project');
      }
      console.error('Error deleting project:', err);
    }
  };

  if (loading && todos.length === 0) {
    return (
      <div className="loading">Loading your workspace...</div>
    );
  }

  return (
    <div className="todo-app">
      <div className="user-greeting">
        <h2>Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User'}! 👋</h2>
        <p>Organize your todos with projects</p>
      </div>
      
      {error && (
        <div className="error-banner">
          {error}
          {error.includes('Authentication') && (
            <div style={{ marginTop: '0.5rem' }}>
              <UserButton />
            </div>
          )}
        </div>
      )}

      {/* Project Management Section */}
      <div className="projects-section">
        <div className="projects-header">
          <h3>📁 Projects</h3>
          <button 
            onClick={() => setShowCreateProject(true)}
            className="create-project-button"
          >
            + New Project
          </button>
        </div>

        <div className="projects-grid">
          {/* All Todos Project */}
          <div 
            className={`project-card ${!selectedProject ? 'selected' : ''}`}
            onClick={() => selectProject(null)}
          >
            <div className="project-color-indicator" style={{ backgroundColor: '#6B7280' }}></div>
            <div className="project-info">
              <h4>📋 All Todos</h4>
              <p>View all your todos across projects</p>
            </div>
          </div>

          {/* User Projects */}
          {projects.map(project => (
            <div 
              key={project.id}
              className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => selectProject(project)}
            >
              <div className="project-color-indicator" style={{ backgroundColor: project.color }}></div>
              <div className="project-info">
                <h4>{project.name}</h4>
                <p>{project.description || 'No description'}</p>
                <div className="project-stats">
                  <span>{project.todoCount} todos</span>
                  <span>•</span>
                  <span>{project.completedCount} completed</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProject(project.id);
                }}
                className="delete-project-button"
                title="Delete project"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Create Project Form */}
        {showCreateProject && (
          <div className="create-project-form">
            <form onSubmit={createProject}>
              <h4>Create New Project</h4>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="project-input"
                required
              />
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Project description (optional)"
                className="project-textarea"
                rows={2}
              />
              <div className="color-picker-section">
                <label>Color:</label>
                <input
                  type="color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="color-picker"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="create-button">Create Project</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateProject(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Todo Section */}
      <div className="todos-section">
        <h3>
          📝 {selectedProject ? `${selectedProject.name} Todos` : 'All Todos'}
        </h3>

        <form onSubmit={addTodo} className="todo-form">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder={selectedProject ? `Add todo to ${selectedProject.name}` : "Add a general todo"}
            className="todo-input"
          />
          <button type="submit" className="add-button">
            Add Todo
          </button>
        </form>

        <div className="todos-container">
          {todos.length === 0 ? (
            <div className="no-todos">
              <p>🎯 No todos yet!</p>
              <p>Add your first todo above to get started.</p>
            </div>
          ) : (
            <ul className="todos-list">
              {todos.map(todo => (
                <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  <span 
                    className="todo-text"
                    onClick={() => toggleTodo(todo.id)}
                    title="Click to toggle completion"
                  >
                    {todo.completed ? '✅' : '⭕'} {todo.text}
                  </span>
                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="delete-button"
                    title="Delete this todo"
                  >
                    🗑️ Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="stats">
          <p>
            📊 <strong>Total:</strong> {todos.length} | 
            <strong> Completed:</strong> {todos.filter(t => t.completed).length} | 
            <strong> Remaining:</strong> {todos.filter(t => !t.completed).length}
          </p>
        </div>
      </div>

      <div className="database-info">
        <p>🗄️ Your todos and projects are securely stored in PostgreSQL and are private to your account.</p>
      </div>
    </div>
  );
}

function App() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="App">
        <div className="loading">🔐 Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🚀 Project Todo Manager</h1>
          <div className="auth-section">
            {!isSignedIn ? (
              <div className="sign-in-prompt">
                <p>🔒 Please sign in to access your personal workspace</p>
                <SignInButton mode="modal">
                  <button className="sign-in-button">
                    Sign In / Sign Up
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div className="user-section">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <main className="main-content">
          {!isSignedIn ? (
            <div className="landing-content">
              <div className="features">
                <h2>🔐 Your Personal Project Manager</h2>
                <div className="feature-list">
                  <div className="feature-item">
                    <span className="feature-icon">📁</span>
                    <span><strong>Project Organization:</strong> Create projects and organize your todos</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🛡️</span>
                    <span><strong>Secure Authentication:</strong> Protected by Clerk with multiple sign-in options</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🗄️</span>
                    <span><strong>PostgreSQL Database:</strong> Your data is safely stored and backed up</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👤</span>
                    <span><strong>Private & Personal:</strong> Only you can see your projects and todos</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎨</span>
                    <span><strong>Customizable Projects:</strong> Add colors and descriptions to your projects</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span><strong>Progress Tracking:</strong> See completion stats for each project</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TodoApp />
          )}
        </main>
      </header>
    </div>
  );
}

export default App;
