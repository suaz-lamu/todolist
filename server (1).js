const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET = 'your_jwt_secret_here';

app.use(cors());
app.use(bodyParser.json());

// In-memory DB
let users = [];
let projects = [];
let tasks = [];

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ------------------ USER ROUTES ------------------

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields required' });

  if (users.find(u => u.email === email))
    return res.status(400).json({ message: 'Email already registered' });

  const id = users.length + 1;
  users.push({ id, name, email, password });
  res.json({ message: 'User created' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: '1h',
  });
  res.json({ token });
});

// ------------------ PROJECT ROUTES ------------------

app.get('/api/projects', authMiddleware, (req, res) => {
  const userProjects = projects.filter(p => p.userId === req.userId);
  res.json(userProjects);
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const { project_name, description, start_date, end_date } = req.body;
  if (!project_name || !description || !start_date || !end_date)
    return res.status(400).json({ message: 'All fields required' });

  const project_id = projects.length + 1;
  projects.push({
    project_id,
    userId: req.userId,
    project_name,
    description,
    start_date,
    end_date,
  });
  res.json({ project_id });
});

// ------------------ TASK ROUTES ------------------

// Get all tasks for a project
app.get('/api/projects/:projectId/tasks', authMiddleware, (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = projects.find(p => p.project_id === projectId && p.userId === req.userId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const projectTasks = tasks.filter(t => t.project_id === projectId);
  res.json(projectTasks);
});

// Create a new task
app.post('/api/projects/:projectId/tasks', authMiddleware, (req, res) => {
  const projectId = Number(req.params.projectId);
  const { task_name, status } = req.body;
  if (!task_name || !status) return res.status(400).json({ message: 'Task name and status required' });

  const project = projects.find(p => p.project_id === projectId && p.userId === req.userId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const task_id = tasks.length + 1;
  tasks.push({ task_id, project_id: projectId, task_name, status });
  res.json({ task_id });
});

// Update a task
app.put('/api/projects/:projectId/tasks/:taskId', authMiddleware, (req, res) => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);
  const { task_name, status } = req.body;

  const project = projects.find(p => p.project_id === projectId && p.userId === req.userId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const task = tasks.find(t => t.task_id === taskId && t.project_id === projectId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  if (task_name) task.task_name = task_name;
  if (status) task.status = status;

  res.json({ message: 'Task updated' });
});

// Delete a task
app.delete('/api/projects/:projectId/tasks/:taskId', authMiddleware, (req, res) => {
  const projectId = Number(req.params.projectId);
  const taskId = Number(req.params.taskId);

  const project = projects.find(p => p.project_id === projectId && p.userId === req.userId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const index = tasks.findIndex(t => t.task_id === taskId && t.project_id === projectId);
  if (index === -1) return res.status(404).json({ message: 'Task not found' });

  tasks.splice(index, 1);
  res.json({ message: 'Task deleted' });
});

// ------------------ DUMMY TASKS ------------------

tasks.push(
  { task_id: 1, project_id: 1, task_name: 'Task 1', status: 'Pending' },
  { task_id: 2, project_id: 1, task_name: 'Task 2', status: 'Completed' }
);

// ------------------ START SERVER ------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
